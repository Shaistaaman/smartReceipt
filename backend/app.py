import boto3
import base64
import json

def categorize_receipt_with_bedrock(image_path: str, categories: list[str]) -> str:
    """
    Categorizes a receipt image using AWS Bedrock (Anthropic Claude 3 Haiku).

    Args:
        image_path: The path to the receipt image file (e.g., "receipt.jpg").
        categories: A list of categories to classify the receipt into.

    Returns:
        The categorized receipt as a string.
    """
    try:
        # Initialize Bedrock runtime client
        bedrock_runtime = boto3.client(
            service_name="bedrock-runtime",
            region_name="us-east-1" # You might need to change this to your region
        )

        # Read the image file and encode it in base64
        with open(image_path, "rb") as image_file:
            encoded_image = base64.b64encode(image_file.read()).decode("utf-8")

        # Construct the prompt for Claude 3 Haiku
        # The prompt instructs the model to analyze the image and categorize it.
        prompt_content = [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",  # Assuming JPEG, adjust if other formats
                    "data": encoded_image,
                },
            },
            {
                "type": "text",
                "text": f"""Analyze the provided receipt image. Extract relevant text and categorize the expense into one of the following categories: {", ".join(categories)}.
                If none of the categories fit, choose "Other".
                Provide only the category name as your answer, e.g., "Food & Dining"."""
            },
        ]

        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 100,
            "messages": [
                {
                    "role": "user",
                    "content": prompt_content
                }
            ]
        })

        model_id = "anthropic.claude-3-haiku-20240307-v1:0" # Or other free Claude 3 model if available

        response = bedrock_runtime.invoke_model(
            body=body,
            modelId=model_id,
            accept="application/json",
            contentType="application/json"
        )

        response_body = json.loads(response.get("body").read())
        
        # Extract the category from the model's response
        category = response_body["content"][0]["text"].strip()
        return category

    except Exception as e:
        print(f"Error categorizing receipt: {e}")
        return f"Error: {e}"

if __name__ == "__main__":
    # Example usage:
    # Create a dummy receipt.jpg for testing
    # In a real scenario, you would have a receipt image here.
    # For demonstration, let's assume you have a receipt.jpg in the same directory.
    # You can create a dummy one for testing purposes.
    # For example, a blank image or an image with some text.

    # Dummy image creation (for testing purposes, you'd replace this with a real receipt)
    # from PIL import Image, ImageDraw, ImageFont
    # img = Image.new('RGB', (600, 400), color = (255, 255, 255))
    # d = ImageDraw.Draw(img)
    # d.text((50,50), "Supermarket Receipt\nMilk: $3.50\nBread: $2.00\nTotal: $5.50", fill=(0,0,0))
    # img.save("receipt.jpg")

    # Make sure you have a 'receipt.jpg' in the 'backend' directory for this to work.
    # For a real test, you'd place a receipt image there.
    
    categories = [
        "Food & Dining",
        "Groceries",
        "Transport",
        "Utilities",
        "Shopping",
        "Entertainment",
        "Healthcare",
        "Education",
        "Travel",
        "Other"
    ]
    
    # IMPORTANT: Replace 'path/to/your/receipt.jpg' with the actual path to your receipt image.
    # For this example, I'm assuming 'receipt.jpg' is in the 'backend' directory.
    receipt_image_path = "/Users/telesoft/SmartReceipts/smartReceiptsTracker/backend/images/receipt5.jpg" 
    
    print(f"Attempting to categorize: {receipt_image_path}")
    categorized_result = categorize_receipt_with_bedrock(receipt_image_path, categories)
    print(f"Categorized as: {categorized_result}")
