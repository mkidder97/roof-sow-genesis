// Building Code and Jurisdiction Mapping
import { JurisdictionData } from '../types';

const JURISDICTION_MAP: Record<string, Record<string, JurisdictionData>> = {
  'FL': {
    'default': { codeCycle: '2023 FBC', asceVersion: '7-16', hvhz: true },
    'Miami-Dade County': { codeCycle: '2023 FBC', asceVersion: '7-16', hvhz: true },
    'Broward County': { codeCycle: '2023 FBC', asceVersion: '7-16', hvhz: true },
    'Monroe County': { codeCycle: '2023 FBC', asceVersion: '7-16', hvhz: true },
    'Palm Beach County': { codeCycle: '2023 FBC', asceVersion: '7-16', hvhz: true },
    'Collier County': { codeCycle: '2023 FBC', asceVersion: '7-16', hvhz: false },
    'Lee County': { codeCycle: '2023 FBC', asceVersion: '7-16', hvhz: false }
  },
  'TX': {
    'default': { codeCycle: '2021 IBC', asceVersion: '7-16', hvhz: false },
    'Dallas County': { codeCycle: '2021 IBC', asceVersion: '7-16', hvhz: false },
    'Harris County': { codeCycle: '2021 IBC', asceVersion: '7-16', hvhz: false },
    'Travis County': { codeCycle: '2021 IBC', asceVersion: '7-16', hvhz: false },
    'Tarrant County': { codeCycle: '2021 IBC', asceVersion: '7-16', hvhz: false },
    'Bexar County': { codeCycle: '2021 IBC', asceVersion: '7-16', hvhz: false }
  },
  'CA': {
    'default': { codeCycle: '2022 CBC', asceVersion: '7-16', hvhz: false },
    'Los Angeles County': { codeCycle: '2022 CBC', asceVersion: '7-16', hvhz: false },
    'Orange County': { codeCycle: '2022 CBC', asceVersion: '7-16', hvhz: false },
    'San Diego County': { codeCycle: '2022 CBC', asceVersion: '7-16', hvhz: false }
  },
  'NY': {
    'default': { codeCycle: '2020 IBC', asceVersion: '7-16', hvhz: false },
    'New York County': { codeCycle: '2020 NYC BC', asceVersion: '7-16', hvhz: false },
    'Kings County': { codeCycle: '2020 NYC BC', asceVersion: '7-16', hvhz: false },
    'Queens County': { codeCycle: '2020 NYC BC', asceVersion: '7-16', hvhz: false }
  },
  'IL': {
    'default': { codeCycle: '2021 IBC', asceVersion: '7-16', hvhz: false },
    'Cook County': { codeCycle: '2021 IBC', asceVersion: '7-16', hvhz: false }
  },
  'GA': {
    'default': { codeCycle: '2020 IBC', asceVersion: '7-16', hvhz: false },
    'Fulton County': { codeCycle: '2020 IBC', asceVersion: '7-16', hvhz: false }
  },
  'NC': {
    'default': { codeCycle: '2018 IBC', asceVersion: '7-16', hvhz: false },
    'Mecklenburg County': { codeCycle: '2018 IBC', asceVersion: '7-16', hvhz: false }
  },
  'LA': {
    'default': { codeCycle: '2021 IBC', asceVersion: '7-16', hvhz: false },
    'Orleans Parish': { codeCycle: '2021 IBC', asceVersion: '7-16', hvhz: false }
  },
  'SC': {
    'default': { codeCycle: '2018 IBC', asceVersion: '7-16', hvhz: false },
    'Charleston County': { codeCycle: '2018 IBC', asceVersion: '7-16', hvhz: false }
  }
};

export async function getJurisdictionData(county: string, state: string): Promise<JurisdictionData> {
  const stateData = JURISDICTION_MAP[state];
  
  if (!stateData) {
    console.log(`⚠️ No jurisdiction mapping found for state: ${state}, using default`);
    // Default for unmapped states
    return { codeCycle: '2021 IBC', asceVersion: '7-16', hvhz: false };
  }
  
  // Check for specific county mapping
  const countyData = stateData[county] || stateData['default'];
  
  console.log(`📋 Jurisdiction: ${county}, ${state} → ${countyData.codeCycle}, ${countyData.asceVersion}, HVHZ: ${countyData.hvhz}`);
  
  return countyData;
}

// Helper function to check if a location requires HVHZ compliance
export function isHVHZLocation(county: string, state: string): boolean {
  if (state !== 'FL') return false;
  
  const hvhzCounties = [
    'Miami-Dade County',
    'Broward County', 
    'Monroe County',
    'Palm Beach County'
  ];
  
  return hvhzCounties.includes(county);
}

// Helper function to get ASCE version based on code cycle
export function getASCEVersion(codeCycle: string): '7-10' | '7-16' | '7-22' {
  if (codeCycle.includes('2023') || codeCycle.includes('2022')) {
    return '7-22';
  } else if (codeCycle.includes('2021') || codeCycle.includes('2020') || codeCycle.includes('2018')) {
    return '7-16';
  } else {
    return '7-10';
  }
}
