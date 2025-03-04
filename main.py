from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModel
import torch

# Initialize FastAPI
app = FastAPI()

# Load your model and tokenizer (this will use the GPU if available)
MODEL_NAME = "sentence-transformers/all-mpnet-base-v2"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModel.from_pretrained(MODEL_NAME)
model.eval()  # set model to evaluation mode

# Define request and response schemas
class EmbeddingRequest(BaseModel):
    text: str

class EmbeddingResponse(BaseModel):
    embedding: list[float]

def get_embedding(text: str) -> list[float]:
    # Tokenize the text
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    
    # If you want to run on GPU, move inputs and model to the GPU:
    if torch.cuda.is_available():
        inputs = {key: value.to("cuda") for key, value in inputs.items()}
        model.to("cuda")
    
    # Perform inference
    with torch.no_grad():
        outputs = model(**inputs)
    
    # Use mean pooling to create a sentence embedding
    token_embeddings = outputs.last_hidden_state  # shape: (batch_size, sequence_length, hidden_size)
    attention_mask = inputs["attention_mask"]
    # Expand attention_mask for element-wise multiplication
    mask = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
    summed = torch.sum(token_embeddings * mask, dim=1)
    counts = torch.clamp(mask.sum(dim=1), min=1e-9)
    mean_pooled = summed / counts

    # Move back to CPU if necessary and convert to a list
    embedding = mean_pooled.squeeze().cpu().tolist()
    return embedding

# Define the API endpoint
@app.post("/embedding", response_model=EmbeddingResponse)
async def compute_embedding(req: EmbeddingRequest):
    try:
        embedding = get_embedding(req.text)
        return {"embedding": embedding}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
