import React from 'react';

function SensorWidget({ label, value, unit, icon, color = 'text-gray-600', threshold, status }) {
  const getIcon = (iconType) => {
    switch (iconType) {
      case 'temperature':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'humidity':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        );
      case 'weight':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l3-1m-3 1l-3-1" />
          </svg>
        );
      case 'battery':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10.5h.5a.5.5 0 01.5.5v2a.5.5 0 01-.5.5H21m0-3V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-1.5m0-3h-1" />
          </svg>
        );
      case 'signal':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
    }
  };

  const getStatusColor = () => {
    if (!threshold || value === null || value === undefined) return color;
    
    if (icon === 'battery') {
      if (value < 20) return 'text-danger-600';
      if (value < 50) return 'text-warning-600';
      return 'text-success-600';
    }
    
    if (icon === 'signal') {
      if (value < -80) return 'text-danger-600';
      if (value < -60) return 'text-warning-600';
      return 'text-success-600';
    }
    
    // For temperature and humidity thresholds
    if (threshold.min !== undefined && value < threshold.min) return 'text-danger-600';
    if (threshold.max !== undefined && value > threshold.max) return 'text-danger-600';
    
    return color;
  };

  const formatValue = (val) => {
    if (val === null || val === undefined) return '--';
    if (typeof val === 'number') {
      return val.toFixed(1);
    }
    return val;
  };

  const getProgressPercentage = () => {
    if (icon === 'battery' && value !== null && value !== undefined) {
      return Math.max(0, Math.min(100, value));
    }
    if (icon === 'humidity' && value !== null && value !== undefined) {
      return Math.max(0, Math.min(100, value));
    }
    return null;
  };

  const progressPercentage = getProgressPercentage();
  const statusColor = getStatusColor();

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className={`${statusColor}`}>
          {getIcon(icon)}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {threshold && (
            <p className="text-xs text-gray-500">
              Rango: {threshold.min || 0} - {threshold.max || 100} {unit}
            </p>
          )}
        </div>
      </div>
      
      <div className="text-right">
        <div className={`text-lg font-semibold ${statusColor}`}>
          {formatValue(value)} {unit}
        </div>
        
        {progressPercentage !== null && (
          <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                progressPercentage < 20 ? 'bg-danger-500' :
                progressPercentage < 50 ? 'bg-warning-500' :
                'bg-success-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        )}
        
        {status && (
          <div className="mt-1">
            <span className={`text-xs px-2 py-1 rounded-full ${
              status === 'normal' ? 'bg-success-100 text-success-800' :
              status === 'warning' ? 'bg-warning-100 text-warning-800' :
              status === 'critical' ? 'bg-danger-100 text-danger-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {status === 'normal' ? 'Normal' :
               status === 'warning' ? 'Advertencia' :
               status === 'critical' ? 'Crítico' :
               'Desconocido'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default SensorWidget;