"use client"

import * as React from "react"

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

const Tabs = ({ defaultValue = "", value, onValueChange, children, className = "" }: TabsProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const currentValue = value ?? internalValue;
  
  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => {
  const baseClasses = "inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500";
  const finalClassName = className ? `${baseClasses} ${className}` : baseClasses;
  
  return (
    <div
      ref={ref}
      className={finalClassName}
      {...props}
    />
  );
});
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className = "", value, children, ...props }, ref) => {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within Tabs");
  
  const isActive = context.value === value;
  
  const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const activeClasses = isActive 
    ? "bg-white text-gray-900 shadow-sm" 
    : "text-gray-600 hover:text-gray-900";
  const finalClassName = className ? `${baseClasses} ${activeClasses} ${className}` : `${baseClasses} ${activeClasses}`;
  
  return (
    <button
      ref={ref}
      className={finalClassName}
      onClick={() => context.onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
});
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className = "", value, children, ...props }, ref) => {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");
  
  if (context.value !== value) return null;
  
  const baseClasses = "mt-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2";
  const finalClassName = className ? `${baseClasses} ${className}` : baseClasses;
  
  return (
    <div
      ref={ref}
      className={finalClassName}
      {...props}
    >
      {children}
    </div>
  );
});
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent }
