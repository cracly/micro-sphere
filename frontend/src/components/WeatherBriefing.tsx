'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, BrainCircuit } from 'lucide-react';

interface WeatherAnalysis {
  timestamp: string;
  english?: string;
  german?: string;
  analysis?: string; // Keep for backward compatibility
}

interface WeatherBriefingProps {
  language: 'en' | 'de';
}

// Translations for the component
const translations = {
  en: {
    weatherBriefing: 'Weather Briefing',
    poweredBy: 'Powered by',
    expandBriefing: 'Show briefing',
    collapseBriefing: 'Hide briefing',
  },
  de: {
    weatherBriefing: 'Wetterbericht',
    poweredBy: 'Bereitgestellt von',
    expandBriefing: 'Bericht anzeigen',
    collapseBriefing: 'Bericht ausblenden',
  },
};

/**
 * Weather Briefing component to display Mistral AI analysis
 *
 * This component fetches the AI-generated weather analysis and displays it in an
 * expandable/collapsible section with attribution to Mistral AI.
 */
const WeatherBriefing: React.FC<WeatherBriefingProps> = ({ language }) => {
  const [analysis, setAnalysis] = useState<WeatherAnalysis | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const t = translations[language];

  useEffect(() => {
    // Fetch the analysis data
    setLoading(true);
    fetch('/backend/data/weather_analysis.json')
      .then((res) => {
        if (!res.ok) {
          console.warn(`Could not load weather analysis: ${res.status}`);
          // Instead of throwing an error, we'll handle this gracefully
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setAnalysis(data);
        } else {
          // Set a fallback message when no data is available
          setAnalysis({
            timestamp: new Date().toISOString(),
            analysis: "Weather analysis is currently unavailable. Check back later for AI-powered weather insights."
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load weather analysis:", err);
        // Set a fallback message when there's an error
        setAnalysis({
          timestamp: new Date().toISOString(),
          analysis: "Weather analysis is currently unavailable. Check back later for AI-powered weather insights."
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (!analysis) {
    return null; // Don't show if there's no analysis data
  }

  // Format the timestamp
  const analysisDate = new Date(analysis.timestamp);
    analysisDate.toLocaleString(
        language === 'de' ? 'de-AT' : undefined
    );
    return (
    <div className="mt-6 mb-4">
      <Button
        variant="ghost"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex justify-between items-center p-2 text-left border-b"
      >
        <div className="flex items-center gap-2">
          <BrainCircuit size={20} className="text-purple-600 dark:text-purple-400" />
          <span className="font-semibold">{t.weatherBriefing}</span>
        </div>
        <div>
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </Button>

      {expanded && (
        <Card className="mt-2 p-4 bg-white/40 dark:bg-neutral-800/40 backdrop-blur-md border border-white/30 dark:border-neutral-700/40 max-w-none">
          <div className="text-sm leading-relaxed weather-content"
               dangerouslySetInnerHTML={{
                 __html: language === 'de'
                   ? analysis.german || analysis.analysis || 'Weather analysis unavailable'
                   : analysis.english || analysis.analysis || 'Weather analysis unavailable'
               }}
          />

          <div className="mt-3 text-xs text-muted-foreground flex items-center justify-end gap-1">
            <span>{t.poweredBy}</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
              Mistral AI <BrainCircuit size={14} />
            </span>
          </div>
        </Card>
      )}
    </div>
  );
};

export default WeatherBriefing;
