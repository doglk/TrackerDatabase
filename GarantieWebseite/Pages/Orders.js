import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download } from "lucide-react";
import OrderList from "../components/orders/OrderList";
import OrderDialog from "../components/orders/OrderDialog";
import OrderFilters from "../components/orders/OrderFilters";

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.filter({ archived: false }, '-created_date'),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const orderNumber = `AUF-${Date.now()}`;
      return base44.entities.Order.create({ ...data, order_number: orderNumber });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsDialogOpen(false);
      setEditingOrder(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsDialogOpen(false);
      setEditingOrder(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Order.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const handleSave = (data) => {
    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Möchten Sie diesen Auftrag wirklich löschen?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleComplete = async (order) => {
    await updateMutation.mutateAsync({ 
      id: order.id, 
      data: { ...order, status: 'abgeschlossen', archived: true } 
    });
  };

  const exportToCSV = () => {
    const headers = ['Auftragsnr.', 'Titel', 'Ort', 'Startdatum', 'Enddatum', 'Status', 'Priorität'];
    const rows = filteredOrders.map(o => [
      o.order_number,
      o.title,
      o.location,
      o.start_date,
      o.end_date,
      o.status,
      o.priority
    ]);
    
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `auftraege_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.order_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || order.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            Aufträge
          </h1>
          <p className="text-slate-600">
            Verwalten Sie alle Aufträge und Zuweisungen
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="border-slate-300"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportieren
          </Button>
          <Button
            onClick={() => {
              setEditingOrder(null);
              setIsDialogOpen(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Neuer Auftrag
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Suche nach Titel, Ort oder Auftragsnummer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 border-slate-300 shadow-sm"
          />
        </div>
        <OrderFilters
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterPriority={filterPriority}
          setFilterPriority={setFilterPriority}
        />
      </div>

      <OrderList
        orders={filteredOrders}
        technicians={technicians}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onComplete={handleComplete}
      />

      <OrderDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        order={editingOrder}
        technicians={technicians}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}