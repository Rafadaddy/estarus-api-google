import { useState, useMemo, useEffect } from "react";
import { googleAppsScriptAPI } from "@/lib/googleAppsScript";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Bus, Download, Trash2, Plus, Search, Hash, RefreshCw, Cloud } from "lucide-react";

interface BusUnit {
  id: number;
  unitNumber: number;
  MOT: string;
  TRAN: string;
  ELE: string;
  AA: string;
  FRE: string;
  SUS: string;
  DIR: string;
  HOJ: string;
  TEL: string;
}

const componentNames = ["MOT", "TRAN", "ELE", "AA", "FRE", "SUS", "DIR", "HOJ", "TEL"];
const componentTitles: Record<string, string> = {
  MOT: "Motor",
  TRAN: "Transmisión",
  ELE: "Eléctrico",
  AA: "Aire Acondicionado",
  FRE: "Frenos",
  SUS: "Suspensión",
  DIR: "Dirección",
  HOJ: "Hojalatería",
  TEL: "Telecomunicaciones"
};

export default function AppsScriptHome() {
  const [units, setUnits] = useState<BusUnit[]>([]);
  const [unitNumber, setUnitNumber] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [componentFilter, setComponentFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Load data from Google Sheets via Apps Script
  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log("Loading data from Google Sheets via Apps Script...");
      const data = await googleAppsScriptAPI.getAllBusUnits();
      console.log("Data loaded successfully:", data);
      setUnits(data);
      
      if (data.length === 0) {
        toast({
          title: "Google Sheets Conectado",
          description: "Conexión exitosa. Los datos se compartirán entre usuarios.",
        });
      } else {
        toast({
          title: "Datos Sincronizados",
          description: `${data.length} unidades cargadas desde Google Sheets`,
        });
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error de Conexión",
        description: "Error al conectar con Google Sheets",
        variant: "destructive",
      });
      setUnits([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter units based on search and filter criteria
  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
      // Search filter
      const matchesSearch = unit.unitNumber.toString().includes(searchTerm);
      
      // Status filter
      let matchesStatus = true;
      if (statusFilter === "ready") {
        matchesStatus = componentNames.every(comp => unit[comp as keyof BusUnit] === "listo");
      } else if (statusFilter === "workshop") {
        matchesStatus = componentNames.every(comp => unit[comp as keyof BusUnit] === "taller");
      } else if (statusFilter === "partial") {
        const readyCount = componentNames.filter(comp => unit[comp as keyof BusUnit] === "listo").length;
        matchesStatus = readyCount > 0 && readyCount < componentNames.length;
      }

      // Component filter
      let matchesComponent = true;
      if (componentFilter && componentFilter !== "all") {
        matchesComponent = unit[componentFilter as keyof BusUnit] === "taller";
      }

      return matchesSearch && matchesStatus && matchesComponent;
    });
  }, [units, searchTerm, statusFilter, componentFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalUnits = units.length;
    const readyUnits = units.filter(unit => 
      componentNames.every(comp => unit[comp as keyof BusUnit] === "listo")
    ).length;
    const workshopUnits = units.filter(unit => 
      componentNames.every(comp => unit[comp as keyof BusUnit] === "taller")
    ).length;
    const partialUnits = totalUnits - readyUnits - workshopUnits;

    return { totalUnits, readyUnits, partialUnits, workshopUnits };
  }, [units]);

  const handleAddUnit = async () => {
    const number = parseInt(unitNumber);
    if (!number || number < 1 || number > 9999) {
      toast({
        title: "Error",
        description: "Por favor, ingrese un número de unidad válido (1-9999).",
        variant: "destructive",
      });
      return;
    }

    // Check if unit number already exists
    if (units.some(unit => unit.unitNumber === number)) {
      toast({
        title: "Error",
        description: "Ya existe una unidad con este número",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const unitData = {
        unitNumber: number,
        MOT: "listo",
        TRAN: "listo",
        ELE: "listo",
        AA: "listo",
        FRE: "listo",
        SUS: "listo",
        DIR: "listo",
        HOJ: "listo",
        TEL: "listo"
      };

      const newUnit = await googleAppsScriptAPI.createBusUnit(unitData);
      setUnits(prev => [...prev, newUnit]);
      setUnitNumber("");
      
      toast({
        title: "Éxito",
        description: `Unidad ${number} agregada exitosamente a Google Sheets.`,
      });
    } catch (error) {
      console.error("Error adding unit:", error);
      toast({
        title: "Error",
        description: "Error al agregar la unidad a Google Sheets",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleStatus = async (unit: BusUnit, component: string) => {
    const currentStatus = unit[component as keyof BusUnit] as string;
    const newStatus = currentStatus === "listo" ? "taller" : "listo";
    
    setIsUpdating(true);
    try {
      const updatedUnit = await googleAppsScriptAPI.updateBusUnit(unit.id, {
        [component]: newStatus
      });

      if (updatedUnit) {
        setUnits(prev => prev.map(u => 
          u.id === unit.id ? updatedUnit : u
        ));
      }
    } catch (error) {
      console.error("Error updating unit:", error);
      toast({
        title: "Error",
        description: "Error al actualizar el estado en Google Sheets",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUnit = async (unitId: number) => {
    setIsUpdating(true);
    try {
      const success = await googleAppsScriptAPI.deleteBusUnit(unitId);
      
      if (success) {
        setUnits(prev => prev.filter(unit => unit.id !== unitId));
        toast({
          title: "Éxito",
          description: "Unidad eliminada exitosamente de Google Sheets.",
        });
      }
    } catch (error) {
      console.error("Error deleting unit:", error);
      toast({
        title: "Error",
        description: "Error al eliminar la unidad de Google Sheets",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAll = async () => {
    setIsUpdating(true);
    try {
      await googleAppsScriptAPI.deleteAllBusUnits();
      setUnits([]);
      toast({
        title: "Éxito",
        description: "Todos los datos han sido eliminados de Google Sheets.",
      });
    } catch (error) {
      console.error("Error deleting all units:", error);
      toast({
        title: "Error",
        description: "Error al eliminar los datos de Google Sheets",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRefresh = () => {
    loadData();
    toast({
      title: "Actualizando",
      description: "Cargando datos más recientes de Google Sheets...",
    });
  };

  const exportToCSV = () => {
    if (units.length === 0) {
      toast({
        title: "Error",
        description: "No hay datos para exportar.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Autobús", ...componentNames];
    const csvContent = [
      headers.join(","),
      ...units.map(unit => [
        unit.unitNumber,
        ...componentNames.map(comp => unit[comp as keyof BusUnit])
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `unidades_autobus_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Éxito",
      description: "Datos exportados exitosamente.",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between h-12 sm:h-16">
            <div className="flex items-center">
              <Bus className="h-6 w-6 sm:h-8 sm:w-8 text-white mr-2" />
              <span className="text-white font-semibold text-sm sm:text-lg">Gestión de Unidades</span>
              <div className="flex items-center text-white/70 text-xs ml-2">
                <Cloud className="h-4 w-4 text-green-400" />
                <span className="ml-1 hidden sm:inline">Google Sheets</span>
              </div>
            </div>
            <div className="flex space-x-1 sm:space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={isLoading}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs sm:text-sm px-2 sm:px-3"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV} className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs sm:text-sm px-2 sm:px-3">
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs sm:text-sm px-2 sm:px-3">
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Limpiar</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Acción</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Está seguro de que desea eliminar todas las unidades de Google Sheets? Esta acción afectará a todos los usuarios y no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-700">
                      Eliminar Todo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
        {/* Statistics */}
        <Card className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
              <div>
                <h3 className="text-lg sm:text-2xl font-bold mb-1">{stats.totalUnits}</h3>
                <p className="text-xs sm:text-sm opacity-90">Total</p>
              </div>
              <div>
                <h3 className="text-lg sm:text-2xl font-bold mb-1 text-green-200">{stats.readyUnits}</h3>
                <p className="text-xs sm:text-sm opacity-90">Listos</p>
              </div>
              <div>
                <h3 className="text-lg sm:text-2xl font-bold mb-1 text-yellow-200">{stats.partialUnits}</h3>
                <p className="text-xs sm:text-sm opacity-90">Parcial</p>
              </div>
              <div>
                <h3 className="text-lg sm:text-2xl font-bold mb-1 text-red-200">{stats.workshopUnits}</h3>
                <p className="text-xs sm:text-sm opacity-90">Taller</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <Card className="mb-3">
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-3">
              {/* Add Unit Row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    min="1"
                    max="9999"
                    placeholder="Número de unidad"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    className="pl-8 h-9"
                    disabled={isUpdating}
                  />
                </div>
                <Button 
                  onClick={handleAddUnit} 
                  disabled={isUpdating}
                  className="h-9 bg-blue-600 hover:bg-blue-700 px-3 sm:px-6"
                >
                  <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{isUpdating ? "Agregando..." : "Agregar"}</span>
                </Button>
              </div>
              
              {/* Search and Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ready">Listos</SelectItem>
                    <SelectItem value="workshop">Taller</SelectItem>
                    <SelectItem value="partial">Parcial</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={componentFilter} onValueChange={setComponentFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Componente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {componentNames.map(comp => (
                      <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Units Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-500 text-sm">Cargando datos compartidos desde Google Sheets...</p>
                </div>
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="text-center p-6">
                <Bus className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-base font-medium text-gray-500 mb-1">No hay unidades</h4>
                <p className="text-gray-400 text-sm">Agregue una nueva unidad para comenzar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-700">
                      <TableHead className="text-white text-center font-semibold py-2 px-1 sm:px-3 text-xs sm:text-sm">
                        <Bus className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                        <span className="hidden sm:inline">Autobús</span>
                        <span className="sm:hidden">Bus</span>
                      </TableHead>
                      {componentNames.map(comp => (
                        <TableHead key={comp} className="text-white text-center font-semibold min-w-[50px] sm:min-w-[70px] py-2 px-1 text-xs sm:text-sm" title={componentTitles[comp]}>
                          {comp}
                        </TableHead>
                      ))}
                      <TableHead className="text-white text-center font-semibold py-2 px-1 text-xs sm:text-sm w-12 sm:w-16">
                        <span className="hidden sm:inline">Acción</span>
                        <span className="sm:hidden">Del</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnits.map((unit) => (
                      <TableRow key={unit.id} className="hover:bg-slate-50">
                        <TableCell className="text-center font-bold text-sm sm:text-lg text-gray-700 py-2 px-1 sm:px-3">
                          {unit.unitNumber}
                        </TableCell>
                        {componentNames.map(comp => {
                          const status = unit[comp as keyof BusUnit] as string;
                          const isReady = status === "listo";
                          return (
                            <TableCell key={comp} className="text-center p-1 sm:p-2">
                              <button
                                onClick={() => handleToggleStatus(unit, comp)}
                                disabled={isUpdating}
                                className={`
                                  px-2 py-1 sm:px-3 sm:py-2 rounded text-xs font-medium uppercase transition-all duration-300 hover:scale-105 w-full min-w-[45px] sm:min-w-[60px] disabled:opacity-50
                                  ${isReady 
                                    ? "bg-green-600 text-white hover:bg-green-700" 
                                    : "bg-red-600 text-white hover:bg-red-700"
                                  }
                                `}
                                title={`Click para cambiar estado de ${componentTitles[comp]}`}
                              >
                                {status}
                              </button>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center py-2 px-1">
                          {(() => {
                            const allReady = componentNames.every(comp => unit[comp as keyof BusUnit] === "listo");
                            return allReady ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" disabled={isUpdating} className="text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200 h-7 w-7 sm:h-8 sm:w-8 p-0">
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      ¿Está seguro de que desea eliminar la unidad {unit.unitNumber}? Esta acción no se puede deshacer y afectará a todos los usuarios.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteUnit(unit.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <Button variant="outline" size="sm" disabled className="text-gray-300 cursor-not-allowed h-7 w-7 sm:h-8 sm:w-8 p-0">
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}