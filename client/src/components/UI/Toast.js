import React from 'react';
import { useToast } from '../../context/ToastContext';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const Toast = () => {
  const { toasts, removeToast } = useToast();

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-600" />;
    }
  };

  const getToastStyles = (type) => {
    const baseStyles = "fixed top-4 right-4 z-50 max-w-sm w-full p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border border-green-200 dark:bg-green-900 dark:border-green-700`;
      case 'error':
        return `${baseStyles} bg-red-50 border border-red-200 dark:bg-red-900 dark:border-red-700`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border border-yellow-200 dark:bg-yellow-900 dark:border-yellow-700`;
      default:
        return `${baseStyles} bg-blue-50 border border-blue-200 dark:bg-blue-900 dark:border-blue-700`;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={getToastStyles(toast.type)}
          style={{
            transform: `translateY(${index * 70}px)`,
            zIndex: 1000 - index
          }}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getToastIcon(toast.type)}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {toast.message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => removeToast(toast.id)}
                className="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Toast; 