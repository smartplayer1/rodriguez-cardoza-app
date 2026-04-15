'use client';
import React, { useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import { DollarSign, ArrowRight, Save, RefreshCw } from 'lucide-react';

interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  inverseRate: number;
  lastUpdated: string;
}

export default function CurrencySettings() {
  const [rates, setRates] = useState<ExchangeRate[]>([
    {
      id: '1',
      fromCurrency: 'USD',
      toCurrency: 'NIO',
      rate: 36.75,
      inverseRate: 0.0272,
      lastUpdated: '2025-11-23'
    }
  ]);

  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('NIO');
  const [rateValue, setRateValue] = useState('');

  const currencies = ['USD', 'NIO', 'EUR', 'MXN', 'GTQ'];

  const handleEditRate = (rate: ExchangeRate) => {
    setEditingRate(rate);
    setFromCurrency(rate.fromCurrency);
    setToCurrency(rate.toCurrency);
    setRateValue(rate.rate.toString());
  };

  const handleSaveRate = () => {
    const newRate = parseFloat(rateValue);
    if (isNaN(newRate) || newRate <= 0) {
      alert('Por favor ingrese un valor de tasa válido');
      return;
    }

    const inverseRate = 1 / newRate;
    const today = new Date().toISOString().split('T')[0];

    if (editingRate) {
      setRates(rates.map(r => 
        r.id === editingRate.id
          ? {
              ...r,
              fromCurrency,
              toCurrency,
              rate: newRate,
              inverseRate,
              lastUpdated: today
            }
          : r
      ));
    } else {
      const newExchangeRate: ExchangeRate = {
        id: Date.now().toString(),
        fromCurrency,
        toCurrency,
        rate: newRate,
        inverseRate,
        lastUpdated: today
      };
      setRates([...rates, newExchangeRate]);
    }

    setEditingRate(null);
    setFromCurrency('USD');
    setToCurrency('NIO');
    setRateValue('');
  };

  const handleCancel = () => {
    setEditingRate(null);
    setFromCurrency('USD');
    setToCurrency('NIO');
    setRateValue('');
  };

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-foreground mb-2">Configuración de Moneda</h2>
        <p className="text-muted-foreground">
          Configure las tasas de cambio entre diferentes monedas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exchange Rate Form */}
        <div className="lg:col-span-1">
          <div className="bg-surface rounded elevation-2 p-6">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign size={24} className="text-primary" />
              <h3 className="text-foreground">
                {editingRate ? 'Editar Tasa' : 'Nueva Tasa de Cambio'}
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              {/* From Currency */}
              <div>
                <label className="text-sm text-foreground mb-2 block">
                  Desde Moneda
                </label>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full px-4 py-3 bg-input-background border-b-2 border-border 
                           focus:border-primary rounded-t transition-colors outline-none"
                >
                  {currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>

              {/* Arrow indicator */}
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ArrowRight size={20} className="text-primary" />
                </div>
              </div>

              {/* To Currency */}
              <div>
                <label className="text-sm text-foreground mb-2 block">
                  Hacia Moneda
                </label>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full px-4 py-3 bg-input-background border-b-2 border-border 
                           focus:border-primary rounded-t transition-colors outline-none"
                >
                  {currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>

              {/* Exchange Rate */}
              <MaterialInput
                label="Tasa de Cambio"
                type="number"
                step="0.0001"
                placeholder="0.00"
                fullWidth
                value={rateValue}
                onChange={(e) => setRateValue(e.target.value)}
                helperText={`1 ${fromCurrency} = ${rateValue || '0'} ${toCurrency}`}
              />

              {/* Inverse Rate Display */}
              {rateValue && parseFloat(rateValue) > 0 && (
                <div className="bg-muted rounded p-3">
                  <p className="text-sm text-muted-foreground">Tasa Inversa</p>
                  <p className="text-foreground">
                    1 {toCurrency} = {(1 / parseFloat(rateValue)).toFixed(4)} {fromCurrency}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <MaterialButton
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<Save size={18} />}
                  onClick={handleSaveRate}
                >
                  {editingRate ? 'Actualizar' : 'Guardar'}
                </MaterialButton>
                {editingRate && (
                  <MaterialButton
                    variant="outlined"
                    color="secondary"
                    onClick={handleCancel}
                  >
                    Cancelar
                  </MaterialButton>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Existing Rates List */}
        <div className="lg:col-span-2">
          <div className="bg-surface rounded elevation-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-foreground">Tasas de Cambio Configuradas</h3>
              <MaterialButton
                variant="text"
                color="primary"
                startIcon={<RefreshCw size={18} />}
                onClick={() => console.log('Actualizar tasas')}
              >
                Actualizar Todas
              </MaterialButton>
            </div>

            {rates.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No hay tasas de cambio configuradas
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rates.map((rate) => (
                  <div
                    key={rate.id}
                    className="border border-border rounded p-4 hover:border-primary 
                             transition-colors cursor-pointer"
                    onClick={() => handleEditRate(rate)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* From Currency */}
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-primary/10 
                                        flex items-center justify-center">
                            <span className="text-primary">{rate.fromCurrency}</span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <ArrowRight size={20} className="text-muted-foreground" />

                        {/* To Currency */}
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-accent/10 
                                        flex items-center justify-center">
                            <span className="text-accent">{rate.toCurrency}</span>
                          </div>
                        </div>

                        {/* Rate Info */}
                        <div className="flex-1">
                          <p className="text-foreground">
                            1 {rate.fromCurrency} = {rate.rate.toFixed(4)} {rate.toCurrency}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            1 {rate.toCurrency} = {rate.inverseRate.toFixed(4)} {rate.fromCurrency}
                          </p>
                        </div>
                      </div>

                      {/* Last Updated */}
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Última actualización
                        </p>
                        <p className="text-sm text-foreground">{rate.lastUpdated}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
