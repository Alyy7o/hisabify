import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { useTransactions, useCategories } from '@/hooks/useAppData';
import { TransactionItem } from '@/components/transaction/TransactionItem';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  startOfDay,
  endOfDay,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  isSameMonth
} from 'date-fns';
import { cn } from '@/lib/utils';
import { EditTransactionDialog } from '@/components/transaction/EditTransactionDialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type FilterType = 'daily' | 'monthly' | 'yearly';

export default function Analytics() {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const [filter, setFilter] = useState<FilterType>('monthly');
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useTranslation();
  const ITEMS_PER_PAGE = 10;

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Filter Transactions based on time range
  const filteredData = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;

    switch (filter) {
      case 'daily':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'yearly':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case 'monthly':
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
    }

    const relevantTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= start && date <= end;
    });

    const income = relevantTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = relevantTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      transactions: relevantTransactions,
      income,
      expense,
      net: income - expense
    };
  }, [transactions, filter]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const expenses = filteredData.transactions.filter(t => t.type === 'expense');
    const categoryTotals = expenses.reduce((acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([categoryId, amount]) => {
        const category = categories.find(c => c.id === categoryId);
        return {
          name: category?.name || 'Other',
          value: amount,
          color: category?.color || '#888',
          icon: category?.icon || '📦',
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredData.transactions, categories]);

  // Bar Chart Data
  const chartData = useMemo(() => {
    const now = new Date();

    if (filter === 'yearly') {
      const months = eachMonthOfInterval({
        start: startOfYear(now),
        end: endOfYear(now)
      });

      return months.map(month => {
        const monthTransactions = filteredData.transactions.filter(t =>
          isSameMonth(new Date(t.date), month)
        );

        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          name: format(month, 'MMM'),
          income,
          expense,
        };
      });
    } else if (filter === 'monthly') {
      const days = eachDayOfInterval({
        start: startOfMonth(now),
        end: now
      });
      // to keep it consistent with "monthly" view, we might want full month, but user context implies "latest".
      // Let's use full month days for the chart x-axis if we want the scale to be consistent, but usually plotting up to 'now' is fine.
      // However, previous code used full month logic in one branch. I will replicate the "show up to today" logic for simplicity or full month if desired.
      // Reverting to full month for x-axis consistency as per earlier code snippet I wrote.
      const fullMonthDays = eachDayOfInterval({
        start: startOfMonth(now),
        end: endOfMonth(now)
      });

      return fullMonthDays.map(day => {
        const dayTransactions = filteredData.transactions.filter(t =>
          isSameDay(new Date(t.date), day)
        );

        const income = dayTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = dayTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          name: format(day, 'd'),
          income,
          expense,
        };
      });
    }

    return []; // No chart for daily
  }, [filteredData.transactions, filter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.transactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const sorted = [...filteredData.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData.transactions, currentPage]);

  const handlePageChange = (page: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      items.push(
        <PaginationItem key="1">
          <PaginationLink href="#" onClick={(e) => handlePageChange(1, e)}>1</PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(<PaginationItem key="ellipsis-start"><PaginationEllipsis /></PaginationItem>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            isActive={currentPage === i}
            onClick={(e) => handlePageChange(i, e)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<PaginationItem key="ellipsis-end"><PaginationEllipsis /></PaginationItem>);
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink href="#" onClick={(e) => handlePageChange(totalPages, e)}>{totalPages}</PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AppLayout title={t('analytics.title')}>
      <div className="min-w-0 space-y-6 py-4">
        {/* Filter Tabs */}
        <div className="flex bg-secondary/50 p-1 rounded-lg animate-fade-in">
          {(['daily', 'monthly', 'yearly'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                filter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              {t(`analytics.${f}`)}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-3 animate-fade-in sm:grid-cols-3">
          <Card className="min-w-0 overflow-hidden p-3 text-center">
            <TrendingUp className="mx-auto mb-1 h-5 w-5 text-success" />
            <p className="text-xs text-muted-foreground">{t('common.income')}</p>
            <p className="truncate text-xs font-bold text-success tabular-nums sm:text-sm">
              {formatCurrency(filteredData.income)}
            </p>
          </Card>
          <Card className="min-w-0 overflow-hidden p-3 text-center">
            <TrendingDown className="mx-auto mb-1 h-5 w-5 text-destructive" />
            <p className="text-xs text-muted-foreground">{t('common.expense')}</p>
            <p className="truncate text-xs font-bold text-destructive tabular-nums sm:text-sm">
              {formatCurrency(filteredData.expense)}
            </p>
          </Card>
          <Card className="min-w-0 overflow-hidden p-3 text-center">
            <Activity className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-xs text-muted-foreground">{t('analytics.net_flow')}</p>
            <p
              className={`truncate text-xs font-bold tabular-nums sm:text-sm ${filteredData.net >= 0 ? 'text-success' : 'text-destructive'}`}
            >
              {formatCurrency(filteredData.net)}
            </p>
          </Card>
        </div>

        {/* Activity Chart */}
        {filter !== 'daily' && (
          <Card className="min-w-0 w-full animate-fade-in overflow-hidden p-4" style={{ animationDelay: '100ms' }}>
            <h3 className="mb-4 font-semibold text-foreground">
              {filter === 'yearly' ? 'Monthly Activity' : 'Daily Activity'}
            </h3>
            <div className="h-40 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    interval={filter === 'yearly' ? 0 : 2}
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
          <Card className="min-w-0 w-full animate-fade-in overflow-hidden p-4" style={{ animationDelay: '200ms' }}>
            <h3 className="mb-4 font-semibold text-foreground">Spending by Category</h3>
            <div className="flex w-full min-w-0 flex-col items-center gap-6 sm:flex-row">
              <div className="h-32 w-32 shrink-0 min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
              <div className="flex-1 w-full space-y-2 min-w-0">
                {categoryData.slice(0, 4).map((category) => (
                  <div key={category.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-foreground truncate">{category.icon} {category.name}</span>
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

        {/* Transaction List */}
        <section className="space-y-3 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h3 className="font-semibold text-foreground">
            {filter === 'daily' ? 'Today\'s Transactions' : 'Transactions'}
          </h3>
          {paginatedTransactions.length === 0 ? (
            <Card className="p-6 border-dashed text-center">
              <p className="text-sm text-muted-foreground">No transactions found</p>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                {paginatedTransactions.map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={(t) => setEditingTransaction(t)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => handlePageChange(currentPage - 1, e)}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {renderPaginationItems()}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => handlePageChange(currentPage + 1, e)}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </section>
      </div>

      <EditTransactionDialog
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        transaction={editingTransaction}
      />
    </AppLayout>
  );
}
