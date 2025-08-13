import React, { useState } from "react";
import api from "../api/axiosClient";

interface Props {
    onUploaded?: (url: string) => void;
}

const ImageUploader: React.FC<Props> = ({ onUploaded }) => {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!image) return;
        const formData = new FormData();
        formData.append("image", image);

        try {
            setUploading(true);
            setError("");
            // Do NOT set Content-Type. Let Axios set boundary automatically.
            const res = await api.post("/upload", formData);
            const url = res.data.imageUrl as string;
            setUploadedUrl(url);
            onUploaded?.(url);
        } catch (err: any) {
            console.error("Upload failed", err);
            const msg = err?.response?.data?.message || err?.message || 'Upload failed';
            setError(msg);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ padding: "20px", maxWidth: "400px" }}>
            <h2>Upload ảnh</h2>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {preview && <img src={preview} alt="preview" style={{ width: "100%", marginTop: "10px" }} />}
            <button onClick={handleUpload} disabled={uploading || !image} style={{ marginTop: "10px" }}>
                {uploading ? 'Đang upload...' : 'Upload'}
            </button>
            {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
            {uploadedUrl && (
                <div>
                    <p>Ảnh đã upload:</p>
                    <img src={uploadedUrl} alt="uploaded" style={{ width: "100%" }} />
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
