from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
import logging
from typing import Optional

import schemas
from dependencies import get_current_user, get_supabase_authed
from ai_manager import AIManager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["ai_generation"])

@router.post("/memory/generate", response_model=schemas.MemoryAids)
async def generate_memory_aids_endpoint(request: schemas.MemoryGenerateRequest, current_user: dict = Depends(get_current_user)):
    logger.info(f"Generating memory aids for user {current_user['id']}")
    
    try:
        ai_manager = AIManager()
        raw_response = ai_manager.generate_memory_aids(request.content)
        
        if not raw_response:
            logger.error("AI service returned empty response")
            raise HTTPException(status_code=500, detail="Failed to generate memory aids from AI service")
        
        logger.info(f"Memory aids generated successfully for user {current_user['id']}")
        return schemas.MemoryAids(**raw_response)
    
    except (AIError, ProviderError) as e:
        logger.error(f"AI service error: {e}")
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")
    except TimeoutError as e:
        logger.error(f"AI service timeout: {e}")
        raise HTTPException(status_code=504, detail=f"AI service timeout: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error generating memory aids: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate memory aids")

@router.post("/generate/image", response_model=schemas.ImageGenerateResponse)
async def generate_image_endpoint(request: schemas.ImageGenerateRequest, current_user: dict = Depends(get_current_user)):
    """
    Generate an actual image based on visual association content
    """
    logger.info(f"Generating image for user {current_user['id']}")
    
    try:
        ai_manager = AIManager()
        result = await ai_manager.generate_image(request.content, request.context)
        
        if not result:
            logger.error("Image generation returned empty result")
            raise HTTPException(status_code=500, detail="Failed to generate image")
        
        logger.info(f"Image generated successfully for user {current_user['id']}")
        return schemas.ImageGenerateResponse(
            image_url=result.get('image_url'),
            image_base64=result.get('image_base64'),
            prompt=result.get('prompt'),
            status=result.get('status', 'generated')
        )
    
    except (AIError, ProviderError) as e:
        logger.error(f"AI service error during image generation: {e}")
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")
    except TimeoutError as e:
        logger.error(f"AI service timeout during image generation: {e}")
        raise HTTPException(status_code=504, detail=f"AI service timeout: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error generating image: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate image")

@router.post("/generate/audio", response_model=schemas.AudioGenerateResponse)
async def generate_audio_endpoint(request: schemas.AudioGenerateRequest, current_user: dict = Depends(get_current_user)):
    """
    Generate actual audio based on auditory association content
    """
    logger.info(f"Generating audio for user {current_user['id']}")
    
    try:
        ai_manager = AIManager()
        result = await ai_manager.generate_audio(request.content, request.context)
        
        if not result:
            logger.error("Audio generation returned empty result")
            raise HTTPException(status_code=500, detail="Failed to generate audio")
        
        logger.info(f"Audio generated successfully for user {current_user['id']}")
        return schemas.AudioGenerateResponse(
            audio_base64=result.get('audio_base64'),
            script=result.get('script'),
            duration=result.get('duration'),
            sound_description=result.get('sound_description'),
            sound_type=result.get('sound_type'),
            message=result.get('message'),
            status=result.get('status', 'generated')
        )
    
    except (AIError, ProviderError) as e:
        logger.error(f"AI service error during audio generation: {e}")
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")
    except TimeoutError as e:
        logger.error(f"AI service timeout during audio generation: {e}")
        raise HTTPException(status_code=504, detail=f"AI service timeout: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error generating audio: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate audio")