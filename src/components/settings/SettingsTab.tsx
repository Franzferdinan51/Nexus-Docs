import React from 'react';
import { ModelConfigPanel } from './ModelConfigPanel';
import { ThemeToggle } from './ThemeToggle';
import { LegalNotice } from './LegalNotice';

interface SettingsTabProps {
  state: any;
  setState: any;
}

export function SettingsTab({ state, setState }: SettingsTabProps) {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <ThemeToggle />
      
      <ModelConfigPanel state={state} setState={setState} />
      
      <LegalNotice />
    </div>
  );
}
