"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [addresses, setAddresses] = useState("");
  const [results, setResults] = useState<{ address: string; round2: bigint }[]>(
    []
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const formatNumber = (value: bigint): string => {
    return (Number(value) / 1e18).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  };

  const handleCheck = useCallback(async () => {
    setIsProcessing(true);
    setError("");
    setResults([]);

    const addressList = addresses
      .split(/[\n,]+/)
      .map((addr) => addr.trim())
      .filter(Boolean);
    const batchSize = 5; // Process 5 addresses at a time
    const delay = 7000; // 2 second delay between batches

    for (let i = 0; i < addressList.length; i += batchSize) {
      const batch = addressList.slice(i, i + batchSize);
      const batchPromises = batch.map(async (address) => {
        try {
          const response = await fetch(
            `/api/checkAllocation?address=${address}`
          );
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          return { address, round2: BigInt(data.round2) };
        } catch (error) {
          console.error(`Error fetching data for ${address}:`, error);
          return { address, round2: BigInt(0) };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      setResults((prev) => [...prev, ...batchResults]);

      if (i + batchSize < addressList.length) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    setIsProcessing(false);
  }, [addresses]);

  const totalRound2 = results.reduce(
    (sum, result) => sum + result.round2,
    BigInt(0)
  );

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        LayerZero reallocation checker
      </h1>
      <Textarea
        placeholder="Enter addresses (separated by commas or newlines)"
        value={addresses}
        onChange={(e) => setAddresses(e.target.value)}
        className="mb-4 h-40"
        rows={8}
      />
      <Button onClick={handleCheck} disabled={isProcessing}>
        {isProcessing ? "Processing..." : "Check Allocations"}
      </Button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {results.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results.map((result, index) => (
              <div key={index} className="mb-2">
                <span className="font-semibold">{result.address}:</span>{" "}
                {formatNumber(result.round2)}
              </div>
            ))}
            <div className="mt-4 font-bold">
              Total Round 2: {formatNumber(totalRound2)}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
