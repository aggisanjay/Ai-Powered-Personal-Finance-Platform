import React, { useState } from 'react';
import { api } from '../api';
import { AssistantResponse } from '../types';
import { Bot, Send, Sparkles, Clock, Coins, Layers, Cpu, ShieldCheck, Database } from 'lucide-react';

export const AssistantPage: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ query: string; response: AssistantResponse }[]>([]);

  const examplePrompts = [
    "How much did I spend on groceries in October compared to last month?",
    "Which subscriptions or recurring payments appear in my records?",
    "How does my spending compare with my category budgets?",
    "What is my net cash flow and savings rate for October 2026?",
  ];

  const handleAsk = async (queryText: string) => {
    if (!queryText.trim()) return;
    setLoading(true);
    try {
      const res = await api.askAssistant(queryText, '2026-10');
      setHistory([{ query: queryText, response: res }, ...history]);
      setQuestion('');
    } catch (err: any) {
      alert(err.message || 'Assistant query failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0E2] border border-[#FF6908]/20 text-xs font-semibold text-[#FF6908] mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ZERO-HALLUCINATION TELEMETRY</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
          Natural Language Finance Assistant
        </h1>
        <p className="text-sm text-[#706F6A] mt-0.5">
          Ask questions in plain English. Every figure is deterministically calculated from your stored transactions with real-time AI telemetry.
        </p>
      </div>

      {/* Input Box */}
      <div className="elevate-card p-4 bg-white space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(question);
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about spending, recurring subscriptions, budgets, or cash flow..."
            className="flex-1 px-4 py-3 rounded-2xl border border-[#E9E1D5] text-sm text-[#111111] focus:outline-hidden focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="btn-black px-6 py-3 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Synthesizing...' : 'Query'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Suggested Queries */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-[#706F6A]">Suggested:</span>
          {examplePrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleAsk(p)}
              className="text-[11px] px-3 py-1 rounded-full bg-[#F8F3E9] text-[#111111] hover:bg-[#FFF5DF] border border-[#E9E1D5] transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Query Answers Stream */}
      <div className="space-y-6">
        {history.map((item, idx) => (
          <div key={idx} className="elevate-card p-6 bg-white space-y-4">
            {/* User Question */}
            <div className="flex items-center gap-2 text-sm font-bold text-[#111111] border-b border-[#E9E1D5] pb-3">
              <span className="w-6 h-6 rounded-lg bg-[#080808] text-white flex items-center justify-center text-xs">
                Q
              </span>
              <span>{item.query}</span>
            </div>

            {/* AI Synthesized Grounded Explanation */}
            <div className="p-4 rounded-2xl bg-[#FFF5DF] border border-[#E9E1D5]">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#FF6908]">
                <Bot className="w-4 h-4" />
                <span>AI Grounded Financial Analysis</span>
              </div>
              <p className="text-sm text-[#111111] leading-relaxed">
                {item.response.explanation}
              </p>
            </div>

            {/* AI Execution Telemetry Bar */}
            <div className="p-3 rounded-xl bg-[#F8F3E9] border border-[#E9E1D5]/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-[#111111]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FF6908]" />
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[#706F6A]">Latency</div>
                  <div className="font-mono font-bold text-[12px]">{item.response.latency_ms ?? 0} ms</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#287650]" />
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[#706F6A]">Cost</div>
                  <div className="font-mono font-bold text-[12px]">
                    ${Number(item.response.cost_usd ?? 0).toFixed(6)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#3559E0]" />
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[#706F6A]">Tokens</div>
                  <div className="font-mono font-bold text-[12px]">
                    {item.response.total_tokens ?? 0} <span className="text-[10px] text-[#706F6A] font-normal">({item.response.prompt_tokens ?? 0} in / {item.response.completion_tokens ?? 0} out)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#9333EA]" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-semibold text-[#706F6A]">Model Source</div>
                  <div className="font-semibold text-[11px] truncate text-[#111111]" title={item.response.model_source ?? 'Grounded AI Engine'}>
                    {item.response.model_source ?? 'Grounded AI Engine'}
                  </div>
                </div>
              </div>
            </div>

            {/* Meta & Evidence Citations */}
            <div className="flex flex-wrap items-center justify-between text-xs text-[#706F6A] pt-1">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#287650]" />
                Range: <strong className="text-[#111111]">{item.response.date_range_applied}</strong>
              </span>
              <span className="text-[11px] font-medium text-[#287650]">
                {item.response.confidence_note}
              </span>
            </div>

            {/* Supporting Transactions Table */}
            {item.response.supporting_transactions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#E9E1D5]">
                <div className="text-xs font-bold text-[#111111] mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#287650]" />
                  <span>Verifiable Supporting Transaction Records:</span>
                </div>
                <div className="rounded-xl border border-[#E9E1D5] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8F3E9] text-[#706F6A]">
                      <tr>
                        <th className="py-2 px-3">ID</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9E1D5]">
                      {item.response.supporting_transactions.map((st) => (
                        <tr key={st.id} className="hover:bg-[#FFFCF5]">
                          <td className="py-2 px-3 font-mono text-[#706F6A]">#{st.id}</td>
                          <td className="py-2 px-3">{st.transaction_date}</td>
                          <td className="py-2 px-3 font-medium text-[#111111]">{st.merchant || st.description}</td>
                          <td className="py-2 px-3 text-[#706F6A]">{st.category_name}</td>
                          <td className="py-2 px-3 text-right font-bold text-[#111111]">
                            ${Number(st.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}

        {history.length === 0 && !loading && (
          <div className="p-12 text-center text-[#706F6A] bg-white rounded-3xl border border-[#E9E1D5]">
            <Bot className="w-12 h-12 text-[#FF6908] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#111111] mb-1">Ask anything about your financial records</h3>
            <p className="text-xs max-w-sm mx-auto">
              Click one of the suggested queries above or type your own question to inspect calculations, full AI model telemetry, and supporting transactions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
