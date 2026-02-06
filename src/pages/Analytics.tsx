import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { TransactionItem } from '@/components/transaction/TransactionItem';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

export default function Analytics() {
  const { transactions, categories, getMonthlyExpenses, getMonthlyIncome } = useStore();

  const monthlyExpenses = getMonthlyExpenses();
  const monthlyIncome = getMonthlyIncome();
  const netFlow = monthlyIncome - monthlyExpenses;

  // Category breakdown for expenses
  const categoryData = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthlyTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return t.type === 'expense' && date >= monthStart && date <= monthEnd;
    });

    const categoryTotals = monthlyTransactions.reduce((acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([categoryId, amount]) => {
      const category = categories.find(c => c.id === categoryId);
      return {
        name: category?.name || 'Other',
        value: amount,
        color: category?.color || '#888',
        icon: category?.icon || '📦',
      };
    }).sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  // Daily spending for the current month
  const dailyData = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const days = eachDayOfInterval({ start: monthStart, end: now });

    return days.map(day => {
      const dayTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return isSameDay(date, day);
      });

      const income = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        date: format(day, 'd'),
        income,
        expense,
      };
    });
  }, [transactions]);

  // Recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AppLayout title="Analytics">
      <div className="py-4 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in">
          <Card className="p-3 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-success" />
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="text-sm font-bold text-success">{formatCurrency(monthlyIncome)}</p>
          </Card>
          <Card className="p-3 text-center">
            <TrendingDown className="w-5 h-5 mx-auto mb-1 text-destructive" />
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="text-sm font-bold text-destructive">{formatCurrency(monthlyExpenses)}</p>
          </Card>
          <Card className="p-3 text-center">
            <Activity className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Net</p>
            <p className={`text-sm font-bold ${netFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(netFlow)}
            </p>
          </Card>
        </div>

        {/* Daily Spending Chart */}
        {dailyData.length > 0 && (
          <Card className="p-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <h3 className="font-semibold text-foreground mb-4">Daily Activity</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === 'income' ? 'Income' : 'Expense'
                    ]}
                  />
                  <Bar dataKey="income" fill="hsl(var(--chart-income))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="hsl(var(--chart-expense))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <Card className="p-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h3 className="font-semibold text-foreground mb-4">Spending by Category</h3>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {categoryData.slice(0, 4).map((category) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-foreground">{category.icon} {category.name}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {formatCurrency(category.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* All Transactions */}
        <section className="space-y-3 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h3 className="font-semibold text-foreground">All Transactions</h3>
          {recentTransactions.length === 0 ? (
            <Card className="p-6 border-dashed text-center">
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
