"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Calendar,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

interface SetupModalProps {
  open: boolean;
  onClose: () => void;
  isConfigured: boolean;
  calendarId?: string;
  clientEmail?: string;
}

export function GoogleCalendarSetupModal({
  open,
  onClose,
  isConfigured,
  calendarId,
  clientEmail,
}: SetupModalProps) {
  const [copiedEnv, setCopiedEnv] = useState(false);

  if (!open) return null;

  const envSample = `GOOGLE_CLIENT_EMAIL="your-service-account@project-id.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYourPrivateKeyHere...\\n-----END PRIVATE KEY-----\\n"
GOOGLE_CALENDAR_ID="your_calendar_id@group.calendar.google.com"`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envSample);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-stone-100 bg-white p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <Calendar size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-[#24203a]">Connect Google Calendar</h3>
                {isConfigured ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live & Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                    Setup Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Enable 2-way event synchronization with a central Google Calendar account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status card if configured */}
        {isConfigured && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs sm:text-sm text-emerald-900 space-y-1">
            <p className="font-bold flex items-center gap-2 text-emerald-800">
              <ShieldCheck size={18} /> Google Calendar API is Active
            </p>
            <p className="text-emerald-700 text-xs">
              Connected Calendar ID: <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono">{calendarId}</code>
            </p>
            <p className="text-emerald-700 text-xs">
              Service Account: <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono">{clientEmail}</code>
            </p>
          </div>
        )}

        {/* Step-by-Step Instructions */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            4-Step Setup Guide (5 Minutes)
          </h4>

          {/* Step 1 */}
          <div className="rounded-2xl border border-stone-200/80 bg-stone-50/50 p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center justify-center size-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                1
              </span>
              <a
                href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                Open Google Cloud Console <ExternalLink size={12} />
              </a>
            </div>
            <h5 className="text-sm font-bold text-stone-800">Enable Google Calendar API</h5>
            <p className="text-xs text-stone-500 leading-relaxed">
              Create a new project or select an existing one in Google Cloud Console, then search for and click <strong>Enable</strong> on the <strong>Google Calendar API</strong>.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-2xl border border-stone-200/80 bg-stone-50/50 p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center justify-center size-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                2
              </span>
              <a
                href="https://console.cloud.google.com/iam-admin/serviceaccounts"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                Create Service Account <ExternalLink size={12} />
              </a>
            </div>
            <h5 className="text-sm font-bold text-stone-800">Generate Service Account Credentials</h5>
            <p className="text-xs text-stone-500 leading-relaxed">
              Go to <strong>IAM & Admin → Service Accounts</strong>. Click <strong>+ Create Service Account</strong> (e.g. name it <code>ssym-calendar-bot</code>). Click into the created account, go to the <strong>Keys</strong> tab, click <strong>Add Key → Create new key (JSON)</strong> and download the key file.
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-2xl border border-stone-200/80 bg-stone-50/50 p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center justify-center size-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                3
              </span>
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                Open Google Calendar <ExternalLink size={12} />
              </a>
            </div>
            <h5 className="text-sm font-bold text-stone-800">Share Calendar with Service Account</h5>
            <p className="text-xs text-stone-500 leading-relaxed">
              Open your Google Calendar on the web. On the left under <em>My calendars</em>, hover over your target calendar, click the 3 dots → <strong>Settings and sharing</strong>. Scroll down to <strong>Share with specific people</strong>, click <strong>+ Add people</strong>, paste your Service Account Email (from step 2), and set permission to <strong>&quot;Make changes to events&quot;</strong>.
            </p>
          </div>

          {/* Step 4 */}
          <div className="rounded-2xl border border-stone-200/80 bg-stone-50/50 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center justify-center size-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                4
              </span>
              <button
                onClick={copyToClipboard}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                {copiedEnv ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    <span className="text-emerald-600">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy Env Template</span>
                  </>
                )}
              </button>
            </div>
            <h5 className="text-sm font-bold text-stone-800">Add Secrets to your <code>.env</code> file</h5>
            <p className="text-xs text-stone-500 leading-relaxed">
              Copy the <strong>Calendar ID</strong> (found in your calendar&apos;s Settings under <em>Integrate calendar</em>) and extract your <code>client_email</code> and <code>private_key</code> from the downloaded JSON file into your root <code>.env</code>:
            </p>

            <div className="relative rounded-xl bg-stone-900 p-3.5 font-mono text-[11px] text-stone-200 overflow-x-auto">
              <pre>{envSample}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-100 pt-4">
          <p className="text-xs text-stone-400">
            Restart your dev server (<code>npm run dev</code>) after updating <code>.env</code>.
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
