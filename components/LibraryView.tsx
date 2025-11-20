
import React, { useState } from 'react';
import { StoredPaper, Folder } from '../types';
import { FolderPlus, Folder as FolderIcon, FileText, Plus, Search, Trash2 } from 'lucide-react';

interface Props {
  papers: StoredPaper[];
  folders: Folder[];
  onSelectPaper: (paper: StoredPaper) => void;
  onDeletePaper: (id: string) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
  onMovePaper: (paperId: string, folderId: string) => void;
  onUploadClick: () => void;
}

export const LibraryView: React.FC<Props> = ({
  papers,
  folders,
  onSelectPaper,
  onDeletePaper,
  onCreateFolder,
  onDeleteFolder,
  onMovePaper,
  onUploadClick
}) => {
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPapers = papers.filter(p => {
    const matchesFolder = activeFolderId === 'all' || p.folderId === activeFolderId;
    const matchesSearch = p.data.title_cn.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.data.title_en.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName);
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto min-h-[80vh] flex gap-8 animate-fade-in">
      
      {/* Sidebar: Folders */}
      <div className="w-64 flex-shrink-0 space-y-6">
        <div>
          <button 
            onClick={onUploadClick}
            className="w-full bg-accent hover:bg-accent-dark text-white py-3 px-4 rounded-xl shadow-lg shadow-accent/20 flex items-center justify-center gap-2 font-medium transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Analyze New Paper
          </button>
        </div>

        <div className="space-y-2">
           <h3 className="text-xs font-bold text-academic-400 uppercase tracking-wider px-2 mb-3">Library Folders</h3>
           
           <button
             onClick={() => setActiveFolderId('all')}
             className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeFolderId === 'all' ? 'bg-white text-accent shadow-sm border border-academic-200' : 'text-academic-600 hover:bg-academic-100'}`}
           >
             <FolderIcon className="w-4 h-4" />
             All Papers
           </button>

           {folders.map(folder => (
             <div key={folder.id} className="group flex items-center justify-between pr-2 hover:bg-academic-100 rounded-lg">
                <button
                  onClick={() => setActiveFolderId(folder.id)}
                  className={`flex-1 flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${activeFolderId === folder.id ? 'text-accent' : 'text-academic-600'}`}
                >
                  <FolderIcon className={`w-4 h-4 ${activeFolderId === folder.id ? 'fill-accent/20' : ''}`} />
                  <span className="truncate">{folder.name}</span>
                </button>
                {folder.id !== 'default' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                    className="p-1.5 text-academic-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
             </div>
           ))}

           {isCreatingFolder ? (
             <div className="px-2 py-1 animate-fade-in">
               <input
                 autoFocus
                 type="text"
                 value={newFolderName}
                 onChange={(e) => setNewFolderName(e.target.value)}
                 onBlur={handleCreateFolder}
                 onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                 placeholder="Folder name..."
                 className="w-full px-3 py-2 rounded-lg border border-accent text-sm outline-none"
               />
             </div>
           ) : (
             <button
               onClick={() => setIsCreatingFolder(true)}
               className="w-full flex items-center gap-2 px-4 py-2 text-sm text-academic-500 hover:text-accent transition-colors mt-2"
             >
               <FolderPlus className="w-4 h-4" />
               New Folder
             </button>
           )}
        </div>
      </div>

      {/* Main Content: Papers Grid */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-serif font-bold text-academic-900">
            {activeFolderId === 'all' ? 'All Papers' : folders.find(f => f.id === activeFolderId)?.name}
          </h2>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search library..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-academic-200 bg-white text-sm w-64 focus:border-accent focus:ring-1 focus:ring-accent outline-none"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-academic-400" />
          </div>
        </div>

        {filteredPapers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-academic-300 text-academic-500">
            <FileText className="w-12 h-12 mb-3 opacity-50" />
            <p>No papers found in this folder.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPapers.map(paper => (
              <div 
                key={paper.id} 
                onClick={() => onSelectPaper(paper)}
                className="bg-white p-6 rounded-xl border border-academic-200 shadow-sm hover:shadow-md hover:border-accent/50 cursor-pointer transition-all duration-300 group flex flex-col h-[280px]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-xs text-academic-500 font-medium">
                     <span className="bg-academic-100 px-2 py-1 rounded">
                       {folders.find(f => f.id === paper.folderId)?.name || 'Uncategorized'}
                     </span>
                     <span>{new Date(paper.uploadDate).toLocaleDateString()}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeletePaper(paper.id); }}
                    className="text-academic-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-serif font-bold text-lg text-academic-900 mb-2 line-clamp-2 leading-tight">
                  {paper.data.title_cn}
                </h3>
                <h4 className="text-sm text-academic-600 mb-4 line-clamp-1 font-medium">
                  {paper.data.title_en}
                </h4>
                
                <p className="text-academic-500 text-sm line-clamp-3 mb-auto leading-relaxed">
                  {paper.data.summary_cn}
                </p>

                <div className="mt-4 pt-4 border-t border-academic-100 flex justify-between items-center">
                  <div className="flex -space-x-2">
                     {paper.data.authors.slice(0, 3).map((auth, i) => (
                       <div key={i} className="w-6 h-6 rounded-full bg-academic-200 border border-white flex items-center justify-center text-[10px] font-bold text-academic-600" title={auth}>
                         {auth[0]}
                       </div>
                     ))}
                  </div>
                  <span className="text-xs font-bold text-accent group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Read Paper →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
