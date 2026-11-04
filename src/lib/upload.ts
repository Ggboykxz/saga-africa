import { api } from "./api";

export async function uploadImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error("read_error"));
    fr.readAsDataURL(file);
  });
  const d = await api.post<{ url: string }>("/api/upload", { dataUrl });
  return d.url;
}
