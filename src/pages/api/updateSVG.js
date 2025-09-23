import pb from "../../utils/pb";
import { Collections } from "../../utils/pocketbase-types";

export async function POST({ request }) {
  const data = await request.json();
  console.log("Received data to update:", data);
  
  try {
    const { id, ...updateData } = data;
    
    if (!id) {
      return new Response(JSON.stringify({ error: "ID is required for update" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    const record = await pb
      .collection(Collections.Svg)
      .update(id, updateData);
    console.log("SVG updated with ID:", record.id);

    return new Response(JSON.stringify({ success: true, id: record.id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating SVG:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}