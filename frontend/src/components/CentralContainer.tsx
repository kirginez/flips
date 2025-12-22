import type { ReactNode } from 'react';

interface CentralContainerProps {
  children: ReactNode;
}

export const CentralContainer = ({ children }: CentralContainerProps) => {
  return (
    <div className="min-h-screen bg-gray-50 md:bg-gray-50 bg-white flex md:items-center items-start justify-center p-0 md:p-4">
      <div className="w-full md:max-w-2xl">
        {children}
      </div>
    </div>
  );
};
