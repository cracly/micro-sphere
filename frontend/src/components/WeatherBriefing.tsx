'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import type { Language, WeatherAnalysis } from '@/lib/types';
import type { Translation } from '@/lib/i18n';
import { formatUpdatedAt } from '@/lib/weather-utils';
import { dataUrl } from '@/lib/data-url';

interface WeatherBriefingProps {
  language: Language;
  t: Translation;
}

// The briefing HTML comes from our own Mistral pipeline, but strip active
// content anyway before embedding it. Inline styles are removed too: LLM
// reports used to ship their own colors/backgrounds, which turn unreadable
// against the page theme (white-on-white in dark mode) — the host page styles
// the semantic tags instead.
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<(iframe|object|embed|form)[\s\S]*?(<\/\1\s*>|\/>)/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\sstyle\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
    .replace(/\s(?:color|bgcolor|background)\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
    .replace(/(?:href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '');
}

/** Expandable AI-generated daily weather briefing (Mistral). */
const WeatherBriefing: React.FC<WeatherBriefingProps> = ({ language, t }) => {
  const [analysis, setAnalysis] = useState<WeatherAnalysis | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch(dataUrl('weather_analysis.json'), { cache: 'no-cache' })
      .then((res) => (res.ok ? res.json() : null))
      .then(setAnalysis)
      .catch(() => setAnalysis(null));
  }, []);

  if (!analysis) return null;

  const html =
    (language === 'de' ? analysis.german : analysis.english) ||
    analysis.analysis ||
    '';
  if (!html) return null;

  return (
    <Card className="gap-0 p-2">
      <Button
        variant="ghost"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="w-full justify-between px-3"
      >
        <span className="flex items-center gap-2 font-semibold">
          <Sparkles size={16} aria-hidden />
          {t.weatherBriefing}
          <span className="text-xs font-normal text-muted-foreground">
            {t.briefingFrom} {formatUpdatedAt(analysis.timestamp, language)}
          </span>
        </span>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </Button>
      {expanded && (
        <div className="px-4 pb-3 pt-1">
          <div
            className="text-sm leading-relaxed [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_p]:my-2"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
          />
          <div className="mt-2 text-right text-xs text-muted-foreground">
            {t.poweredBy} Mistral AI
          </div>
        </div>
      )}
    </Card>
  );
};

export default WeatherBriefing;
