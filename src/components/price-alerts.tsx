"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { Bell, BellOff, Trash2 } from "lucide-react";

interface PriceAlert {
  id: string;
  crypto?: string;
  fiat?: string;
  condition: "ABOVE" | "BELOW";
  price: number;
  paymentMethods?: string[];
  minAmount?: number;
  maxAmount?: number;
  active: boolean;
}

interface PriceAlertsProps {
  alerts: PriceAlert[];
  loading?: boolean;
  error?: string;
  onAddAlert?: (alert: Omit<PriceAlert, "id">) => void;
  onToggleAlert?: (id: string) => void;
  onDeleteAlert?: (id: string) => void;
}

export function PriceAlerts({
  alerts = [],
  loading = false,
  error,
  onAddAlert,
  onToggleAlert,
  onDeleteAlert
}: PriceAlertsProps) {
  const [price, setPrice] = useState<string>("");
  const [condition, setCondition] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [priceError, setPriceError] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = () => {
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setPriceError("Please enter a valid price");
      return;
    }

    onAddAlert?.({
      condition,
      price: Number(price),
      active: true
    });

    setPrice("");
    setCondition("ABOVE");
    setPriceError("");
    setIsDialogOpen(false);
  };

  if (loading) {
    return <div role="status">Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Price Alerts</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Alert</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label htmlFor="condition">Condition</label>
                  <select
                    id="condition"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as "ABOVE" | "BELOW")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="ABOVE">Above</option>
                    <option value="BELOW">Below</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="price">Price</label>
                  <input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Enter price"
                  />
                  {priceError && <div className="text-red-500 text-sm">{priceError}</div>}
                </div>
              </div>
              <button
                onClick={handleSubmit}
                data-testid="submit-alert"
                className="flex h-10 w-full items-center justify-center rounded-md bg-primary text-primary-foreground shadow hover:bg-primary/90"
              >
                Submit
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4">
        {alerts.length === 0 ? (
          <div>No active alerts</div>
        ) : (
          alerts.map((alert) => (
            <Alert key={alert.id} variant={alert.active ? "default" : "secondary"}>
              <div className="flex items-center justify-between">
                <div>
                  <AlertTitle className="flex items-center gap-2">
                    ${alert.price.toLocaleString()} {alert.condition.toLowerCase()}
                  </AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 text-sm">
                      {alert.active ? "Active" : "Inactive"}
                      {alert.paymentMethods && (
                        <div>Payment Methods: {alert.paymentMethods.join(", ")}</div>
                      )}
                      {alert.minAmount && (
                        <div>Min Amount: ${alert.minAmount}</div>
                      )}
                      {alert.maxAmount && (
                        <div>Max Amount: ${alert.maxAmount}</div>
                      )}
                    </div>
                  </AlertDescription>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleAlert?.(alert.id)}
                    aria-label={alert.active ? "Deactivate" : "Activate"}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  >
                    {alert.active ? (
                      <>
                        <Bell className="h-4 w-4" />
                        <span className="sr-only">Deactivate</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="h-4 w-4" />
                        <span className="sr-only">Activate</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onDeleteAlert?.(alert.id)}
                    aria-label="Delete"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </button>
                </div>
              </div>
            </Alert>
          ))
        )}
      </div>
    </div>
  );
} 