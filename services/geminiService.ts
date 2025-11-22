
import { GoogleGenAI, Type } from "@google/genai";
import { Trade, PropAccount } from "../types";

// Ensure API key is present
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to strip markdown asterisks
const cleanText = (text: string) => {
    return text.replace(/\*\*/g, '').replace(/\*/g, '');
};

export const analyzeTradeWithGemini = async (trade: Trade): Promise<{ analysis: string, rating: number, advice: string }> => {
  if (!apiKey) {
    return {
        analysis: "API Key missing. Please configure process.env.API_KEY to use AI features.",
        rating: 0,
        advice: "Configuration Error"
    };
  }

  const prompt = `
    Act as a world-class professional trading psychologist and technical analyst.
    Analyze this specific trade execution data and provide coaching.

    Trade Details:
    - Symbol: ${trade.symbol}
    - Direction: ${trade.direction}
    - Entry Price: ${trade.entryPrice}
    - Exit Price: ${trade.exitPrice}
    - Result: ${trade.outcome} (P&L: ${trade.pnl})
    - Setup: ${trade.setup}
    - Tagged Mistakes: ${trade.mistakes.join(', ') || 'None'}
    - Trader Notes: "${trade.notes.replace(/"/g, "'")}"

    Return a pure JSON object (no markdown) with:
    1. 'analysis' (string): Concise critique of execution and risk management.
    2. 'rating' (number): 1-10 score of execution quality.
    3. 'advice' (string): Single actionable improvement tip.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            rating: { type: Type.NUMBER },
            advice: { type: Type.STRING }
          },
          required: ["analysis", "rating", "advice"]
        }
      }
    });

    let text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    // Robust Clean-up: Remove markdown code blocks if the model adds them
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      analysis: "Unable to analyze trade at this time due to a processing error.",
      rating: 0,
      advice: "Please check your API key or try again later."
    };
  }
};

export const generateStrategyAnalysis = async (trades: Trade[], timeframe: string): Promise<string> => {
    if (!apiKey) return "API Key Missing. Configure environment variables.";

    // 1. Aggregate Data for the Prompt
    const setupPerformance: {[key: string]: {pnl: number, wins: number, total: number}} = {};
    let totalPnl = 0;

    trades.forEach(t => {
        const setup = t.setup || 'Unknown';
        if (!setupPerformance[setup]) setupPerformance[setup] = { pnl: 0, wins: 0, total: 0 };
        setupPerformance[setup].pnl += t.pnl;
        setupPerformance[setup].total += 1;
        if (t.pnl > 0) setupPerformance[setup].wins += 1;
        totalPnl += t.pnl;
    });

    const summaryStr = Object.entries(setupPerformance)
        .map(([name, stats]) => `- ${name}: $${stats.pnl.toFixed(0)} Net (${stats.wins}/${stats.total} Wins)`)
        .join('\n');

    const prompt = `
        You are an elite Trading Performance Analyst.
        
        Timeframe: ${timeframe}
        Total Net P&L: $${totalPnl.toFixed(2)}

        Strategy Breakdown:
        ${summaryStr}

        Task:
        Write a concise, 2-paragraph executive summary for the trader.
        1. Paragraph 1: Analyze what is working best. Identify the highest performing setup.
        2. Paragraph 2: Identify the "leak" (worst performing setup) and give specific advice on whether to size down or stop trading it.
        
        Tone: Professional, Direct, Analytical. No formatting/markdown.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return cleanText(response.text || "Analysis unavailable.");
    } catch (e) {
        return "Could not generate strategy analysis.";
    }
}

export interface ChatAttachment {
    name?: string;
    mimeType: string;
    data: string; // base64 string (usually includes prefix data:image/...)
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  attachments?: ChatAttachment[];
}

export const sendICTChatMessage = async (
  history: ChatMessage[], 
  newMessage: string,
  newAttachments: ChatAttachment[] = [],
  trades: Trade[], 
  accounts: PropAccount[]
): Promise<string> => {
    if (!apiKey) return "API Key Missing. Please configure your environment to use the ICT Engine.";

    // Context Builder
    const tradeContext = trades.slice(0, 30).map(t => 
      `- ${t.entryDate.split('T')[0]}: ${t.symbol} ${t.direction} (${t.outcome}) P&L: ${t.pnl}, Setup: ${t.setup}, Mistakes: ${t.mistakes.join(', ')}`
    ).join('\n');

    const accountContext = accounts.map(a => 
      `- ${a.firmName} (${a.status}): Payouts: ${a.totalPayouts}, ROI: ${a.cost > 0 ? ((a.totalPayouts - a.cost)/a.cost*100).toFixed(1) : 0}%`
    ).join('\n');

    const systemInstruction = `
      You are the "ICT Engine", a strict but helpful professional trading mentor specializing in ICT and SMC concepts.
      
      Current Trader Data (Context):
      RECENT TRADES:
      ${tradeContext}
      
      FUNDED ACCOUNTS:
      ${accountContext}

      Guidelines:
      1. Answer the user's question directly.
      2. Use the context provided above to give specific examples from their actual trading.
      3. Be concise and professional.
      4. Focus on psychology and risk management.
      5. DO NOT use bolding (asterisks) in your response. Keep it plain text.
      6. If an image is provided, analyze the chart structure, identifying key levels (FVGs, OBs, Liquidity) based on ICT concepts.
    `;

    try {
      // Convert history to SDK format
      // Note: For chat history with images, we need to format properly. 
      // The current SDK chat functionality might require strict text history or careful handling of parts.
      // To simplify, we will construct the history with parts.
      const sdkHistory = history.map(h => {
        const parts: any[] = [{ text: h.text }];
        if (h.attachments && h.attachments.length > 0) {
            h.attachments.forEach(att => {
                // Strip "data:image/png;base64," prefix for the SDK
                const base64Data = att.data.split(',')[1];
                if (base64Data) {
                    parts.push({
                        inlineData: {
                            mimeType: att.mimeType,
                            data: base64Data
                        }
                    });
                }
            });
        }
        return {
            role: h.role,
            parts: parts
        };
      });

      // Initialize chat with history
      const chatSession = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: systemInstruction,
        },
        history: sdkHistory
      });

      // Prepare the new message with text and potentially images
      const messageParts: any[] = [{ text: newMessage }];
      
      if (newAttachments.length > 0) {
          newAttachments.forEach(att => {
              const base64Data = att.data.split(',')[1];
              if (base64Data) {
                  messageParts.push({
                      inlineData: {
                          mimeType: att.mimeType,
                          data: base64Data
                      }
                  });
              }
          });
      }

      // Send message (SDK expects an object with parts for multimodal chat messages)
      const result = await chatSession.sendMessage({
         parts: messageParts
      });

      return cleanText(result.text || "I couldn't process that.");

    } catch (error) {
      console.error("ICT Chat Error:", error);
      return "ICT Engine connection interrupted. Please try again.";
    }
};
