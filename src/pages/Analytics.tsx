import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { useTransactions, useCategories } from '@/hooks/useAppData';
import { TransactionItem } from '@/components/transaction/TransactionItem';
import { TransactionDetailDialog } from '@/components/transaction/TransactionDetailDialog';
import { AnalyticsDateFilter, type AnalyticsFilterType } from '@/components/analytics/AnalyticsDateFilter';
import { getAnalyticsDateRange } from '@/lib/analyticsDateRange';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  isSameMonth,
  differenceInCalendarDays,
} from 'date-fns';
import { EditTransactionDialog } from '@/components/transaction/EditTransactionDialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Transaction } from '@/lib/types';

const todayIso = () => format(new Date(), 'yyyy-MM-dd');

export default function Analytics() {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const [filter, setFilter] = useState<AnalyticsFilterType>('monthly');
  const [selectedDay, setSelectedDay] = useState(todayIso);
  const [rangeStart, setRangeStart] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [rangeEnd, setRangeEnd] = useState(todayIso);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useTranslation();
  const ITEMS_PER_PAGE = 10;

  const dateRange = useMemo(
    () => getAnalyticsDateRange(filter, { selectedDay, rangeStart, rangeEnd }),
    [filter, selectedDay, rangeStart, rangeEnd]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, selectedDay, rangeStart, rangeEnd]);

  const filteredData = useMemo(() => {
    const { start, end } = dateRange;
    const relevantTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= start && date <= end;
    });

    const income = relevantTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = relevantTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      transactions: relevantTransactions,
      income,
      expense,
      net: income - expense,
      start,
      end,
    };
  }, [transactions, dateRange]);

  const categoryData = useMemo(() => {
    const expenses = filteredData.transactions.filter((t) => t.type === 'expense');
    const categoryTotals = expenses.reduce((acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([categoryId, amount]) => {
        const category = categories.find((c) => c.id === categoryId);
        return {
          name: category?.name || 'Other',
          value: amount,
          color: category?.color || '#888',
          icon: category?.icon || '📦',
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredData.transactions, categories]);

  const chartData = useMemo(() => {
    const { start, end } = filteredData;

    if (filter === 'yearly') {
      const months = eachMonthOfInterval({ start: startOfYear(start), end: endOfYear(start) });
      return months.map((month) => {
        const monthTransactions = filteredData.transactions.filter((t) =>
          isSameMonth(new Date(t.date), month)
        );
        return {
          name: format(month, 'MMM'),
          income: monthTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: monthTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        };
      });
    }

    if (filter === 'monthly') {
      const days = eachDayOfInterval({ start: startOfMonth(start), end: endOfMonth(start) });
      return days.map((day) => {
        const dayTransactions = filteredData.transactions.filter((t) =>
          isSameDay(new Date(t.date), day)
        );
        return {
          name: format(day, 'd'),
          income: dayTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: dayTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        };
      });
    }

    if (filter === 'today' || filter === 'day') {
      return [
        {
          name: format(start, 'MMM d'),
          income: filteredData.transactions
            .filter((t) => t.type === 'income')
            .reduce((s, t) => s + t.amount, 0),
          expense: filteredData.transactions
            .filter((t) => t.type === 'expense')
            .reduce((s, t) => s + t.amount, 0),
        },
      ];
    }

    if (filter === 'range') {
      const days = eachDayOfInterval({ start, end });
      return days.map((day) => {
        const dayTransactions = filteredData.transactions.filter((t) =>
          isSameDay(new Date(t.date), day)
        );
        return {
          name: format(day, 'MMM d'),
          income: dayTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: dayTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        };
      });
    }

    return [];
  }, [filteredData, filter]);

  const chartTickInterval = useMemo(() => {
    if (filter === 'yearly') return 0;
    if (filter === 'monthly') return 2;
    if (filter === 'range') {
      const days = differenceInCalendarDays(filteredData.end, filteredData.start) + 1;
      if (days <= 14) return 0;
      return Math.max(1, Math.floor(days / 7));
    }
    return 0;
  }, [filter, filteredData.end, filteredData.start]);

  const listTitle = useMemo(() => {
    if (filter === 'today') return t('analytics.todays_transactions', { defaultValue: "Today's transactions" });
    if (filter === 'day') {
      return t('analytics.day_transactions', {
        defaultValue: 'Transactions on {{date}}',
        date: format(filteredData.start, 'PPP'),
      });
    }
    if (filter === 'range') {
      return t('analytics.range_transactions', {
        defaultValue: '{{start}} – {{end}}',
        start: format(filteredData.start, 'MMM d, yyyy'),
        end: format(filteredData.end, 'MMM d, yyyy'),
      });
    }
    return t('analytics.all_transactions', { defaultValue: 'Transactions' });
  }, [filter, filteredData.start, filteredData.end, t]);

  const totalPages = Math.ceil(filteredData.transactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const sorted = [...filteredData.transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
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

  const chartTitle =
    filter === 'yearly'
      ? t('analytics.monthly_activity')
      : filter === 'monthly'
        ? t('analytics.daily_activity')
        : filter === 'range'
          ? t('analytics.range_activity', { defaultValue: 'Activity in range' })
          : t('analytics.daily_activity');

  return (
    <AppLayout title={t('analytics.title')}>
      <div className="min-w-0 space-y-6 py-4">
        <AnalyticsDateFilter
          filter={filter}
          onFilterChange={setFilter}
          selectedDay={selectedDay}
          onSelectedDayChange={setSelectedDay}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onRangeStartChange={setRangeStart}
          onRangeEndChange={setRangeEnd}
        />

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

        {chartData.length > 0 && (
          <Card className="min-w-0 w-full animate-fade-in overflow-hidden p-4" style={{ animationDelay: '100ms' }}>
            <h3 className="mb-4 font-semibold text-foreground">{chartTitle}</h3>
            <div className="h-40 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    interval={chartTickInterval}
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
                      name === 'income' ? 'Income' : 'Expense',
                    ]}
                  />
                  <Bar dataKey="income" fill="hsl(var(--chart-income))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="hsl(var(--chart-expense))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {categoryData.length > 0 && (
          <Card className="min-w-0 w-full animate-fade-in overflow-hidden p-4" style={{ animationDelay: '200ms' }}>
            <h3 className="mb-4 font-semibold text-foreground">
              {t('analytics.spending_by_category')}
            </h3>
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
              <div className="min-w-0 flex-1 space-y-2">
                {categoryData.slice(0, 4).map((category) => (
                  <div key={category.name} className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="truncate text-sm text-foreground">
                        {category.icon} {category.name}
                      </span>
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

        <section className="animate-fade-in space-y-3" style={{ animationDelay: '300ms' }}>
          <h3 className="font-semibold text-foreground">{listTitle}</h3>
          {paginatedTransactions.length === 0 ? (
            <Card className="border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">No transactions found</p>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                {paginatedTransactions.map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    onClick={() => setViewingTransaction(transaction)}
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
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    {renderPaginationItems()}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => handlePageChange(currentPage + 1, e)}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </section>
      </div>

      <TransactionDetailDialog
        open={!!viewingTransaction}
        onOpenChange={(open) => !open && setViewingTransaction(null)}
        transaction={viewingTransaction}
        onEdit={(t) => {
          setViewingTransaction(null);
          setEditingTransaction(t);
        }}
      />
      <EditTransactionDialog
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        transaction={editingTransaction}
      />
    </AppLayout>
  );
}
