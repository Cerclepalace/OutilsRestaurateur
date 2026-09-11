#!/usr/bin/env bash
# =============================================================================
# BOBO PARIS — stock race condition
#
# Two customers reach for the last piece at the same time. Exactly one may win.
#
#   DATABASE_URL=postgres://… bash tests/db/race.sh
#
# Two scenarios are exercised:
#
#   1. Overlapping transactions. A reserves and holds its row lock; B arrives
#      inside that window and blocks on the same row. When A commits, B must
#      re-read the updated figures, find nothing left, and fail.
#
#   2. A simultaneous start, ten buyers for three pieces. Exactly three succeed.
#
# Scenario 1 is the deterministic proof; scenario 2 is the realistic one.
# =============================================================================
set -uo pipefail

DB="${DATABASE_URL:-postgres://postgres@127.0.0.1:5433/bobo}"
PSQL="psql $DB -v ON_ERROR_STOP=1 -tA -q"
ADDRESS='{"line1":"1 rue de Test","postal_code":"75011","city":"Paris","country_code":"FR"}'

fail() { echo "ÉCHEC: $*" >&2; exit 1; }

# --- Fixture: one variant, exactly one unit available ------------------------
VARIANT=$($PSQL -c "
  select v.id from public.product_variants v
  join public.products p on p.id = v.product_id
  join public.inventory i on i.variant_id = v.id
  where p.status = 'active' and i.track_inventory and not i.allow_backorder
  order by v.sku limit 1;")
[ -n "$VARIANT" ] || fail "aucune déclinaison exploitable"

restore() {
  $PSQL -c "
    delete from public.inventory_movements where variant_id = '$VARIANT';
    delete from public.order_items where variant_id = '$VARIANT';
    delete from public.orders where email like '%@race.invalid';
    update public.inventory set quantity = $1, reserved = 0 where variant_id = '$VARIANT';" >/dev/null
}

ORIGINAL=$($PSQL -c "select quantity from public.inventory where variant_id = '$VARIANT';")
cleanup() { restore "$ORIGINAL"; }
trap cleanup EXIT

order_sql() {
  echo "select public.create_order(
          jsonb_build_array(jsonb_build_object('variant_id', '$VARIANT', 'quantity', 1)),
          '$1@race.invalid',
          '$ADDRESS'::jsonb) is not null;"
}

# --- Scenario 1: overlapping transactions ------------------------------------
echo "1. Transactions qui se chevauchent, stock = 1"
restore 1

(
  psql "$DB" -v ON_ERROR_STOP=1 -tA -q <<EOF >/tmp/race_a.out 2>&1
begin;
$(order_sql a)
select pg_sleep(3);
commit;
EOF
  echo "$?" > /tmp/race_a.code
) &
A_PID=$!

sleep 1   # B arrives while A still holds the inventory row lock

(
  psql "$DB" -v ON_ERROR_STOP=1 -tA -q <<EOF >/tmp/race_b.out 2>&1
begin;
$(order_sql b)
commit;
EOF
  echo "$?" > /tmp/race_b.code
) &
B_PID=$!

wait $A_PID $B_PID
A=$(cat /tmp/race_a.code); B=$(cat /tmp/race_b.code)

echo "   A: exit $A    B: exit $B"
[ "$A" = "0" ] || fail "le premier client aurait dû réussir (sortie $A)"
[ "$B" = "0" ] && fail "les DEUX clients ont acheté la dernière pièce"
grep -q "out_of_stock" /tmp/race_b.out || fail "B a échoué pour une autre raison : $(head -2 /tmp/race_b.out)"

SOLD=$($PSQL -c "select count(*) from public.orders where email like '%@race.invalid';")
[ "$SOLD" = "1" ] || fail "$SOLD commandes créées, une seule attendue"
RESERVED=$($PSQL -c "select reserved from public.inventory where variant_id = '$VARIANT';")
[ "$RESERVED" = "1" ] || fail "réservation à $RESERVED, 1 attendue"
echo "   ✓ un seul gagnant, stock réservé une seule fois"

# --- Scenario 2: ten simultaneous buyers, three pieces -----------------------
echo
echo "2. Départ simultané, 10 acheteurs pour 3 pièces"
restore 3

START=$($PSQL -c "select (clock_timestamp() + interval '3 seconds')::text;")
for i in $(seq 1 10); do
  (
    psql "$DB" -v ON_ERROR_STOP=1 -tA -q <<EOF >/tmp/race_m_$i.out 2>&1
select pg_sleep(greatest(0, extract(epoch from ('$START'::timestamptz - clock_timestamp()))));
$(order_sql "m$i")
EOF
    echo "$?" > /tmp/race_m_$i.code
  ) &
done
wait

WON=0
for i in $(seq 1 10); do [ "$(cat /tmp/race_m_$i.code)" = "0" ] && WON=$((WON + 1)); done

ORDERS=$($PSQL -c "select count(*) from public.orders where email like '%@race.invalid';")
RESERVED=$($PSQL -c "select reserved from public.inventory where variant_id = '$VARIANT';")

echo "   gagnants: $WON    commandes: $ORDERS    réservé: $RESERVED"
[ "$WON" = "3" ] || fail "$WON gagnants pour 3 pièces"
[ "$ORDERS" = "3" ] || fail "$ORDERS commandes pour 3 pièces"
[ "$RESERVED" = "3" ] || fail "réservation à $RESERVED, 3 attendues"
echo "   ✓ exactement trois gagnants, jamais de survente"

echo
echo "================================================"
echo " Concurrence stock : aucune survente possible"
echo "================================================"
