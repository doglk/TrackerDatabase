import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Users } from "lucide-react";
import { format, parseISO, eachDayOfInterval, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay, isWithinInterval } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ResourcePlanning() {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { locale: de }));

  const { data: technicians = [], isLoading: techLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => base44.entities.Technician.list(),
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.filter({ archived: false }),
  });

  const weekEnd = endOfWeek(currentWeekStart, { locale: de });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

  const nextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const prevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { locale: de }));

  const getOrdersForTechnicianOnDay = (technicianId, day) => {
    return orders.filter(o => {
      if (!o.assigned_technicians?.includes(technicianId) || o.status === 'abgeschlossen') {
        return false;
      }
      
      // Check if order has start_date and end_date
      if (!o.start_date || !o.end_date) {
        return false;
      }
      
      try {
        return isWithinInterval(day, {
          start: parseISO(o.start_date),
          end: parseISO(o.end_date)
        });
      } catch (e) {
        return false;
      }
    });
  };

  const isLoading = techLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const activeTechnicians = technicians.filter(t => t.status === 'active');

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            Ressourcenplanung
          </h1>
          <p className="text-slate-600">
            Übersicht der Techniker-Verfügbarkeit und Aufträge
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={prevWeek}
            className="border-slate-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            onClick={goToToday}
            className="border-slate-300"
          >
            Heute
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextWeek}
            className="border-slate-300"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Woche: {format(currentWeekStart, "dd.MM.", { locale: de })} - {format(weekEnd, "dd.MM.yyyy", { locale: de })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-4 text-left font-semibold text-slate-900 min-w-[150px] sticky left-0 bg-slate-50 z-10">
                    Techniker
                  </th>
                  {weekDays.map((day) => {
                    const isToday = isSameDay(day, new Date());
                    return (
                      <th
                        key={day.toISOString()}
                        className={`p-4 text-center font-semibold min-w-[120px] ${
                          isToday ? 'bg-blue-50 text-blue-900' : 'text-slate-900'
                        }`}
                      >
                        <div>{format(day, "EEE", { locale: de })}</div>
                        <div className={`text-sm ${isToday ? 'font-bold' : 'font-normal'}`}>
                          {format(day, "dd.MM.")}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {activeTechnicians.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Users className="w-12 h-12 text-slate-400" />
                        <p className="text-slate-500">Keine aktiven Techniker</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  activeTechnicians.map((tech) => (
                    <tr key={tech.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-medium sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {tech.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{tech.name}</div>
                            {tech.specialization && (
                              <div className="text-xs text-slate-500">{tech.specialization}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      {weekDays.map((day) => {
                        const techOrders = getOrdersForTechnicianOnDay(tech.id, day);
                        const isToday = isSameDay(day, new Date());
                        
                        return (
                          <td
                            key={day.toISOString()}
                            className={`p-2 align-top ${isToday ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="space-y-1">
                              {techOrders.map((order) => (
                                <Badge
                                  key={order.id}
                                  className="bg-blue-100 text-blue-800 border-blue-200 border text-xs block truncate"
                                  title={`${order.title} - ${order.location}`}
                                >
                                  📋 {order.title}
                                </Badge>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="p-4 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-lg">📋</span>
          </div>
          <div>
            <div className="text-sm text-slate-600">Zugewiesener Auftrag</div>
            <div className="font-semibold text-slate-900">
              Techniker ist für den gesamten Zeitraum des Auftrags eingeplant
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}