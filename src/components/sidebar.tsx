import { useState } from "react";
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
        isCollapsed ? "w-16" : "w-64"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={cn(
            "transition-all duration-300 overflow-hidden",
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            Settings
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-4 w-4" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "space-y-6 transition-all duration-300",
            isCollapsed ? "invisible w-0" : "visible w-auto"
          )}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Exchange</label>
              <Select value={exchange} onValueChange={onExchangeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exchange" />
                </SelectTrigger>
                <SelectContent>
                  {exchanges.map((ex) => (
                    <SelectItem key={ex} value={ex}>
                      {ex.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fiat Currency</label>
              <Select value={fiat} onValueChange={onFiatChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fiat currency" />
                </SelectTrigger>
                <SelectContent>
                  {fiatCurrencies.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Crypto Currency</label>
              <Select value={crypto} onValueChange={onCryptoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select crypto currency" />
                </SelectTrigger>
                <SelectContent>
                  {cryptoCurrencies.map((c) => (
                    <SelectItem key={c} value={c}>
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