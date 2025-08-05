import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-moment';
import moment from 'moment';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

function ChartWidget({ nodeId, period = 'day', height = 300, showControls = true }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [selectedMetrics, setSelectedMetrics] = useState({
    temperature: true,
    humidity: true,
    weight: true
  });

  useEffect(() => {
    if (nodeId) {
      fetchChartData();
    }
  }, [nodeId, selectedPeriod]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/data/node/${nodeId}/historical`, {
        params: {
          period: selectedPeriod,
          limit: selectedPeriod === 'day' ? 144 : selectedPeriod === 'week' ? 168 : 720
        }
      });
      setData(response.data.data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!data || data.length === 0) return null;

    const datasets = [];
    
    if (selectedMetrics.temperature) {
      datasets.push({
        label: 'Temperatura (°C)',
        data: data.map(item => ({
          x: item.timestamp,
          y: item.data?.temperature || item.temperature
        })),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.1,
        yAxisID: 'y'
      });
    }

    if (selectedMetrics.humidity) {
      datasets.push({
        label: 'Humedad (%)',
        data: data.map(item => ({
          x: item.timestamp,
          y: item.data?.humidity || item.humidity
        })),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        yAxisID: 'y1'
      });
    }

    if (selectedMetrics.weight && data.some(item => item.data?.weight)) {
      datasets.push({
        label: 'Peso (kg)',
        data: data.map(item => ({
          x: item.timestamp,
          y: item.data?.weight
        })).filter(item => item.y !== undefined),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
        yAxisID: 'y2'
      });
    }

    return {
      datasets
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            return moment(context[0].parsed.x).format('DD/MM/YYYY HH:mm');
          },
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          displayFormats: {
            hour: 'HH:mm',
            day: 'DD/MM',
            week: 'DD/MM',
            month: 'MMM'
          }
        },
        title: {
          display: true,
          text: 'Tiempo'
        }
      },
      y: {
        type: 'linear',
        display: selectedMetrics.temperature,
        position: 'left',
        title: {
          display: true,
          text: 'Temperatura (°C)'
        },
        grid: {
          drawOnChartArea: true,
        },
      },
      y1: {
        type: 'linear',
        display: selectedMetrics.humidity,
        position: 'right',
        title: {
          display: true,
          text: 'Humedad (%)'
        },
        grid: {
          drawOnChartArea: false,
        },
        min: 0,
        max: 100
      },
      y2: {
        type: 'linear',
        display: selectedMetrics.weight && data?.some(item => item.data?.weight),
        position: 'right',
        title: {
          display: true,
          text: 'Peso (kg)'
        },
        grid: {
          drawOnChartArea: false,
        },
      }
    },
  };

  const chartData = getChartData();

  return (
    <div className="card">
      {showControls && (
        <div className="card-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h3 className="text-lg font-medium text-gray-900">Datos Históricos</h3>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Period Selection */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="form-input"
              >
                <option value="day">Último día</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>
              
              {/* Metric Selection */}
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedMetrics.temperature}
                    onChange={(e) => setSelectedMetrics(prev => ({
                      ...prev,
                      temperature: e.target.checked
                    }))}
                    className="form-checkbox h-4 w-4 text-danger-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Temperatura</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedMetrics.humidity}
                    onChange={(e) => setSelectedMetrics(prev => ({
                      ...prev,
                      humidity: e.target.checked
                    }))}
                    className="form-checkbox h-4 w-4 text-secondary-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Humedad</span>
                </label>
                
                {data?.some(item => item.data?.weight) && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedMetrics.weight}
                      onChange={(e) => setSelectedMetrics(prev => ({
                        ...prev,
                        weight: e.target.checked
                      }))}
                      className="form-checkbox h-4 w-4 text-success-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Peso</span>
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="card-body">
        {loading ? (
          <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
            <LoadingSpinner size="lg" text="Cargando gráfico..." />
          </div>
        ) : chartData && chartData.datasets.length > 0 ? (
          <div className="chart-container" style={{ height: `${height}px` }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center" style={{ height: `${height}px` }}>
            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No hay datos disponibles para el período seleccionado</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChartWidget;