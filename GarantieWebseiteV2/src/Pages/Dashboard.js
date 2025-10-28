import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ClipboardList, 
  Users, 
  CheckCircle2, 
  Calendar,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import DashboardStats from "../components/dashboard/DashboardStats";
import RecentOrders from "../components/dashboard/RecentOrders";
import TechnicianAvailability from "../components/dashboard/TechnicianAvailability";

export default function Dashboard() {
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const { data: technicians = [], isLoading: techniciansLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
  });

  const openOrders = orders.filter(o => !o.archived && o.status !== 'abgeschlossen');
  const completedOrders = orders.filter(o => o.status === 'abgeschlossen');
  const urgentOrders = openOrders.filter(o => o.priority === 'dringend');
  const activeTechnicians = technicians.filter(t => t.status === 'active');

  const stats = [
    {
      title: "Offene Aufträge",
      value: openOrders.length,
      icon: ClipboardList,
      color: "from-blue-500 to-blue-600",
      link: createPageUrl("Orders"),
    },
    {
      title: "Aktive Techniker",
      value: activeTechnicians.length,
      icon: Users,
      color: "from-green-500 to-green-600",
      link: createPageUrl("Technicians"),
    },
    {
      title: "Abgeschlossen",
      value: completedOrders.length,
      icon: CheckCircle2,
      color: "from-purple-500 to-purple-600",
      link: createPageUrl("Archive"),
    },
    {
      title: "Dringende Aufträge",
      value: urgentOrders.length,
      icon: AlertCircle,
      color: "from-red-500 to-red-600",
      link: createPageUrl("Orders"),
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            Dashboard
          </h1>
          <p className="text-slate-600">
            Willkommen zurück! Hier ist Ihre Übersicht.
          </p>
        </div>
        <Link to={createPageUrl("Orders")}>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
            <ClipboardList className="w-4 h-4 mr-2" />
            Neuer Auftrag
          </Button>
        </Link>
      </div>

      <DashboardStats stats={stats} isLoading={ordersLoading || techniciansLoading} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrders 
            orders={openOrders.slice(0, 5)} 
            isLoading={ordersLoading}
            technicians={technicians}
          />
        </div>
        <div>
          <TechnicianAvailability 
            technicians={technicians}
            orders={orders}
            isLoading={techniciansLoading || ordersLoading}
          />
        </div>
      </div>
    </div>
  );
}