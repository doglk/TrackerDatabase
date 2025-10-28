import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import TechnicianList from "../components/technicians/TechnicianList";
import TechnicianDialog from "../components/technicians/TechnicianDialog";
import OrderAssignmentDialog from "../components/technicians/OrderAssignmentDialog";

export default function Technicians() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isTechDialogOpen, setIsTechDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);

  const queryClient = useQueryClient();

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.filter({ archived: false }),
  });

  const createTechMutation = useMutation({
    mutationFn: (data) => base44.entities.Technician.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setIsTechDialogOpen(false);
      setEditingTechnician(null);
    },
  });

  const updateTechMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Technician.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setIsTechDialogOpen(false);
      setEditingTechnician(null);
    },
  });

  const deleteTechMutation = useMutation({
    mutationFn: (id) => base44.entities.Technician.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Order.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const handleSaveTechnician = (data) => {
    if (editingTechnician) {
      updateTechMutation.mutate({ id: editingTechnician.id, data });
    } else {
      createTechMutation.mutate(data);
    }
  };

  const handleEditTechnician = (technician) => {
    setEditingTechnician(technician);
    setIsTechDialogOpen(true);
  };

  const handleDeleteTechnician = (id) => {
    if (confirm('Möchten Sie diesen Techniker wirklich löschen?')) {
      deleteTechMutation.mutate(id);
    }
  };

  const handleManageOrders = (technician) => {
    setSelectedTechnician(technician);
    setIsAssignDialogOpen(true);
  };

  const handleToggleOrderAssignment = (order) => {
    const currentTechIds = order.assigned_technicians || [];
    const isAssigned = currentTechIds.includes(selectedTechnician.id);
    
    const updatedTechIds = isAssigned
      ? currentTechIds.filter(id => id !== selectedTechnician.id)
      : [...currentTechIds, selectedTechnician.id];
    
    updateOrderMutation.mutate({
      id: order.id,
      data: { ...order, assigned_technicians: updatedTechIds }
    });
  };

  const filteredTechnicians = technicians.filter(tech =>
    tech.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTechnicianOrders = (technicianId) => {
    return orders.filter(o => o.assigned_technicians?.includes(technicianId));
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            Techniker
          </h1>
          <p className="text-slate-600">
            Verwalten Sie Ihr Team und deren Verfügbarkeit
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTechnician(null);
            setIsTechDialogOpen(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Neuer Techniker
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Suche nach Name, E-Mail oder Spezialisierung..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 border-slate-300 shadow-sm"
        />
      </div>

      <TechnicianList
        technicians={filteredTechnicians}
        orders={orders}
        isLoading={isLoading}
        onEdit={handleEditTechnician}
        onDelete={handleDeleteTechnician}
        onManageOrders={handleManageOrders}
        getTechnicianOrders={getTechnicianOrders}
      />

      <TechnicianDialog
        open={isTechDialogOpen}
        onOpenChange={setIsTechDialogOpen}
        technician={editingTechnician}
        onSave={handleSaveTechnician}
        isSaving={createTechMutation.isPending || updateTechMutation.isPending}
      />

      <OrderAssignmentDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        technician={selectedTechnician}
        orders={orders}
        onToggleAssignment={handleToggleOrderAssignment}
      />
    </div>
  );
}