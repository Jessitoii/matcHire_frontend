import React from 'react';

interface FilePreviewProps {
  files: File[];
}

const FilePreview: React.FC<FilePreviewProps> = ({ files }) => {
  return (
    <div className="file-preview">
      {files.length === 0 ? (
        <p>No files uploaded.</p>
      ) : (
        <ul>
          {files.map((file, index) => (
            <li key={index}>
              {file.name} - {Math.round(file.size / 1024)} KB
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FilePreview;