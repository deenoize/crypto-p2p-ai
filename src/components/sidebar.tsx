import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  exchange: string;
  fiat: string;
  crypto: string;
  onExchangeChange: (exchange: string) => void;
  onFiatChange: (fiat: string) => void;
  onCryptoChange: (crypto: string) => void;
}

const exchanges = ["binance", "huobi", "okx", "bybit"];
const fiatCurrencies = ["USD", "EUR", "GBP", "CNY", "RUB", "TRY", "VND", "THB", "KRW", "JPY"];
const cryptoCurrencies = ["BTC", "ETH", "USDT", "USDC", "BNB", "XRP", "ADA", "DOGE", "MATIC", "SOL"];

export function Sidebar({
  exchange,
  fiat,
  crypto,
  onExchangeChange,
  onFiatChange,
  onCryptoChange,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="relative h-full">
      <Card className={cn(
        "h-full transition-all duration-300 ease-in-out",
        isCollapsed ? "w-12" : "w-32"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
          <CardTitle className={cn(
            "text-xs transition-all duration-300 overflow-hidden",
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            Settings
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-3 w-3" />
            ) : (
              <ChevronLeftIcon className="h-3 w-3" />
            )}
          </Button>
        </CardHeader>
        <CardContent className="p-2">
          <div className={cn(
            "space-y-3 transition-all duration-300",
            isCollapsed ? "invisible w-0" : "visible w-auto"
          )}>
            <div className="space-y-1">
              <label className="text-xs font-medium">Exchange</label>
              <Select value={exchange} onValueChange={onExchangeChange}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Exchange" />
                </SelectTrigger>
                <SelectContent>
                  {exchanges.map((ex) => (
                    <SelectItem key={ex} value={ex} className="text-xs">
                      {ex.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Fiat</label>
              <Select value={fiat} onValueChange={onFiatChange}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Fiat" />
                </SelectTrigger>
                <SelectContent>
                  {fiatCurrencies.map((f) => (
                    <SelectItem key={f} value={f} className="text-xs">
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Crypto</label>
              <Select value={crypto} onValueChange={onCryptoChange}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Crypto" />
                </SelectTrigger>
                <SelectContent>
                  {cryptoCurrencies.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 