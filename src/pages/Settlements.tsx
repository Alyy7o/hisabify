import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSettlements, useDeleteSettlement } from '@/hooks/useAppData';
import { AddSettlementDialog } from '@/components/settlement/AddSettlementDialog';
import { SettlementMovementDialog } from '@/components/settlement/SettlementMovementDialog';
import { SettlementCard } from '@/components/settlement/SettlementCard';
import { SettlementDetailDialog } from '@/components/settlement/SettlementDetailDialog';
import { Settlement } from '@/lib/types';
import { HandCoins, ArrowRight, Plus, History } from 'lucide-react';
import { format } from 'date-fns';

type ViewFilter = 'active' | 'completed' | 'all';

export default function Settlements() {
  const { data: settlements = [], isLoading } = useSettlements();
  const deleteSettlementMutation = useDeleteSettlement();
  const navigate = useNavigate();
  const location = useLocation();
  const [filter, setFilter] = useState<ViewFilter>('active');
  const [showAddSettlement, setShowAddSettlement] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState<typeof settlements[number] | null>(null);
  const [movementSettlement, setMovementSettlement] = useState<typeof settlements[number] | null>(null);
  const [viewingSettlement, setViewingSettlement] = useState<Settlement | null>(null);

  const searchParams = new URLSearchParams(location.search);
  const openNew = searchParams.get('new') === '1';

  useEffect(() => {
    if (openNew) {
      setShowAddSettlement(true);
    }
  }, [openNew]);

  const visibleSettlements = useMemo(() => {
    if (filter === 'all') {
      return [...settlements].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    return settlements
      .filter((settlement) => settlement.status === filter)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [filter, settlements]);

  const recentMovements = useMemo(() => {
    return settlements
      .flatMap((settlement) => settlement.movements
        .filter((movement) => movement.kind === 'payment')
        .map((movement) => ({ settlement, movement })))
      .sort((a, b) => new Date(b.movement.date).getTime() - new Date(a.movement.date).getTime())
      .slice(0, 8);
  }, [settlements]);

  const totalGiven = settlements
    .filter((settlement) => settlement.kind === 'given')
    .reduce((sum, settlement) => sum + settlement.remainingAmount, 0);
  const totalReceived = settlements
    .filter((settlement) => settlement.kind === 'received')
    .reduce((sum, settlement) => sum + settlement.remainingAmount, 0);
  const activeCount = settlements.filter((settlement) => settlement.status === 'active').length;

  const handleCloseAdd = (open: boolean) => {
    setShowAddSettlement(open);
    if (!open) {
      setEditingSettlement(null);
    }
    if (!open && openNew) {
      navigate('/settlements', { replace: true });
    }
  };

  const handleEditSettlement = (settlement: typeof settlements[number]) => {
    setEditingSettlement(settlement);
    setShowAddSettlement(true);
  };

  const handleDeleteSettlement = (settlement: typeof settlements[number]) => {
    deleteSettlementMutation.mutate(settlement.id);
    if (movementSettlement?.id === settlement.id) {
      setMovementSettlement(null);
    }
    if (editingSettlement?.id === settlement.id) {
      setEditingSettlement(null);
    }
  };

  return (
    <AppLayout title="Settlements">
      <div className="py-4 space-y-6">
        <Card className="p-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg shadow-primary/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <HandCoins className="w-5 h-5" />
                <p className="text-sm font-medium text-primary-foreground/80">Settlement</p>
              </div>
              <p className="mt-2 text-3xl font-bold truncate max-w-[180px] xs:max-w-[250px] sm:max-w-[300px]">Rs {(totalGiven + totalReceived).toLocaleString()}</p>
              <p className="mt-1 text-sm text-primary-foreground/80">{activeCount} active settlement{activeCount !== 1 ? 's' : ''}</p>
            </div>
            <Button variant="secondary" onClick={() => setShowAddSettlement(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-primary-foreground/10 p-3 min-w-0">
              <p className="text-primary-foreground/70 truncate">They owe you</p>
              <p className="font-semibold truncate">Rs {totalGiven.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-primary-foreground/10 p-3 min-w-0">
              <p className="text-primary-foreground/70 truncate">You owe them</p>
              <p className="font-semibold truncate">Rs {totalReceived.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-2">
          {(['active', 'completed', 'all'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-all ${filter === tab ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground hover:text-foreground'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{filter === 'active' ? 'Active settlements' : filter === 'completed' ? 'Completed settlements' : 'All settlements'}</h2>
          <Link to="/" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
            Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : visibleSettlements.length === 0 ? (
          <Card className="p-8 border-dashed">
            <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
              <History className="w-10 h-10" />
              <div>
                <p className="font-medium text-foreground">No settlements yet</p>
                <p className="text-sm">Add a future amount and record payments as transactions later.</p>
              </div>
              <Button onClick={() => setShowAddSettlement(true)}>Create settlement</Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {visibleSettlements.map((settlement) => (
              <SettlementCard
                key={settlement.id}
                settlement={settlement}
                onAddPayment={setMovementSettlement}
                onEdit={handleEditSettlement}
                onDelete={handleDeleteSettlement}
                onView={setViewingSettlement}
              />
            ))}
          </div>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent movements</h2>
            <Badge variant="outline">{recentMovements.length}</Badge>
          </div>

          {recentMovements.length === 0 ? (
            <Card className="p-5 border-dashed text-center text-sm text-muted-foreground">
              No movement history yet.
            </Card>
          ) : (
            <div className="space-y-2">
              {recentMovements.map(({ settlement, movement }) => (
                <Card key={movement.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground truncate max-w-[150px] sm:max-w-[250px]">{settlement.personName}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-[250px]">Payment · {settlement.title}</p>
                    </div>
                    <div className={`text-sm font-semibold shrink-0 max-w-[100px] sm:max-w-[150px] truncate text-right ${movement.direction === 'inflow' ? 'text-success' : 'text-destructive'}`}>
                      {movement.direction === 'inflow' ? '+' : '-'}Rs {movement.amount.toLocaleString()}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{format(new Date(movement.date), 'MMM d, yyyy')}</p>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <AddSettlementDialog
        open={showAddSettlement}
        onOpenChange={handleCloseAdd}
        initialSettlement={editingSettlement}
      />
      <SettlementMovementDialog
        open={!!movementSettlement}
        onOpenChange={(open) => {
          if (!open) {
            setMovementSettlement(null);
          }
        }}
        settlement={movementSettlement}
      />
      <SettlementDetailDialog
        open={!!viewingSettlement}
        onOpenChange={(open) => !open && setViewingSettlement(null)}
        settlement={viewingSettlement}
      />
    </AppLayout>
  );
}