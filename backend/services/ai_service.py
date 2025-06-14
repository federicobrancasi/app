# backend/services/ai_service.py
import base64
import logging
from datetime import datetime
from typing import Any, Dict, List

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self):
        # For now, we'll use mock responses
        # When you have the Anthropic API key, uncomment the lines below:
        # if settings.ANTHROPIC_API_KEY:
        #     from anthropic import AsyncAnthropic
        #     self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        # else:
        #     self.client = None

        self.client = None  # Use mock for now
        logger.info("AI Service initialized with mock responses")

        self.system_prompt = """You are VisionGuard AI, an intelligent CCTV assistant specialized in security monitoring and video analysis. You help users:

1. Monitor camera feeds and analyze security events
2. Optimize camera settings and system performance  
3. Generate security reports and insights
4. Troubleshoot technical issues
5. Provide proactive security recommendations

You have access to:
- Camera status and configuration data
- Security event logs and analytics
- System performance metrics
- Video analysis capabilities

Always provide helpful, accurate, and security-focused responses. Be concise but thorough, and suggest actionable next steps when appropriate."""

    async def chat_query(
        self,
        message: str,
        context: Dict[str, Any] = None,
        history: List[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Process a chat message and return AI response"""

        # For now, always use mock responses
        return await self._get_mock_response(message, context)

    async def _get_mock_response(
        self, message: str, context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate mock responses when Claude API is not available"""

        message_lower = message.lower()

        # Camera status queries
        if any(
            word in message_lower for word in ["camera", "status", "online", "working"]
        ):
            response = """📹 **Camera Status Report**

All 4 cameras are currently online and functioning normally:

• **Camera 1** (Front Entrance): ✅ Online - Recording in HD
• **Camera 2** (Parking Lot): ✅ Online - Night vision active  
• **Camera 3** (Warehouse): ✅ Online - Motion detection enabled
• **Camera 4** (Emergency Exit): ✅ Online - Recording normally

**System Health**: Excellent
**Last Status Check**: Just now
**Storage Space**: 85% available

Everything looks great! Is there a specific camera you'd like me to analyze further?"""

        # Security events
        elif any(
            word in message_lower for word in ["event", "alert", "security", "incident"]
        ):
            response = """🔍 **Recent Security Events**

Here's what I found in the last 24 hours:

**Today's Activity:**
• 23 motion detections (normal traffic)
• 2 person detections after hours
• 1 vehicle detection in restricted area

**Notable Events:**
• 🚨 **2:14 AM** - Unknown person detected near Camera 3 (Warehouse)
• ⚠️ **Yesterday 6:30 PM** - Vehicle lingered in parking lot for 15+ minutes

**Analysis**: Most activity appears routine. The overnight detection warrants attention - would you like me to pull up that footage?"""

        # Optimization requests
        elif any(
            word in message_lower
            for word in ["optimize", "improve", "settings", "night"]
        ):
            response = """⚡ **AI Optimization Recommendations**

I've analyzed your system and found these improvements:

**Camera 2 (Parking Lot):**
• Reduce IR sensitivity by 15% to minimize false positives
• Adjust motion detection zone to exclude tree movement

**Camera 3 (Warehouse):**
• Enable advanced person detection for better accuracy
• Increase recording quality during business hours

**System-wide:**
• Schedule automatic lens cleaning reminders
• Enable smart compression to save 25% storage space

**Estimated Impact**: 15% fewer false alerts, 20% better night detection

Would you like me to apply these optimizations automatically?"""

        # Technical help
        elif any(
            word in message_lower
            for word in ["help", "troubleshoot", "problem", "issue"]
        ):
            response = """🔧 **Technical Support**

I'm here to help! Common issues I can assist with:

**Camera Issues:**
• Connection problems and network diagnostics
• Video quality optimization
• Storage and recording settings

**Detection Problems:**
• False positive reduction
• Sensitivity adjustments  
• Zone configuration

**System Maintenance:**
• Performance monitoring
• Update management
• Backup verification

What specific issue are you experiencing? The more details you provide, the better I can help!"""

        # Default response
        else:
            response = """🤖 **VisionGuard AI Assistant**

I'm here to help you manage your security system! I can assist with:

• **Camera Management** - Status checks, settings, troubleshooting
• **Security Analysis** - Event review, pattern detection, alerts
• **System Optimization** - Performance tuning, recommendations
• **Reports & Insights** - Activity summaries, security reports

What would you like me to help you with today? You can ask me questions like:
- "Show me today's security events"
- "How are my cameras performing?"
- "Optimize my system settings"
- "Generate a weekly security report"

Feel free to ask me anything about your VisionGuard system!"""

        suggestions = self._generate_suggestions(message, response)

        return {
            "response": response,
            "timestamp": datetime.now().isoformat(),
            "suggestions": suggestions,
            "conversation_id": f"mock_conv_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        }

    def _generate_suggestions(self, original_message: str, response: str) -> List[str]:
        """Generate follow-up suggestions based on the conversation"""

        # Default suggestions pool
        all_suggestions = [
            "Show me a detailed camera status report",
            "What security events happened yesterday?",
            "How can I optimize my camera settings?",
            "Generate a weekly security summary",
            "Check for any system maintenance needed",
            "Show me motion detection patterns",
            "Help me troubleshoot Camera connectivity",
            "What are the best practices for night vision?",
            "Review today's visitor activity",
            "Set up custom alert rules",
        ]

        # Pick 3-4 relevant suggestions
        return all_suggestions[:4]

    def _frame_to_base64(self, frame: np.ndarray) -> str:
        """Convert video frame to base64 for API transmission"""
        _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        return base64.b64encode(buf).decode("utf-8")


# Singleton instance
_ai_service = None


def get_ai_service() -> AIService:
    """Get the AI service singleton instance"""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
