import { useState, useEffect } from "react";
import { Search, X, BookOpen, Code, Copy, Check } from "lucide-react";
import {
  INSTRUCTION_SET_DATA,
  INSTRUCTION_CATEGORIES,
  type InstructionCategory,
  type InstructionItem,
} from "../utils/instructionSetData";

export interface InstructionSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExample: (exampleCode: string) => void;
}

export default function InstructionSetModal({
  isOpen,
  onClose,
  onSelectExample,
}: InstructionSetModalProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<InstructionCategory>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedOpcode, setCopiedOpcode] = useState<string | null>(null);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Safe string matching without regex execution (avoids ReDoS & Injection)
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredInstructions = INSTRUCTION_SET_DATA.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;

    if (!normalizedQuery) return matchesCategory;

    const matchesSearch =
      item.opcode.toLowerCase().includes(normalizedQuery) ||
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.syntax.toLowerCase().includes(normalizedQuery) ||
      item.description.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesSearch;
  });

  const handleCopyExample = (exampleText: string, opcode: string) => {
    navigator.clipboard.writeText(exampleText);
    setCopiedOpcode(opcode);
    setTimeout(() => setCopiedOpcode(null), 2000);
  };

  return (
    <div
      className="yj-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="yj-instruction-modal-title"
    >
      <div
        className="yj-modal-content yj-instruction-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="yj-modal-header">
          <div className="yj-modal-header-title">
            <BookOpen className="yj-modal-header-icon" size={22} />
            <h2 id="yj-instruction-modal-title">
              8086 Assembly Instruction Set
            </h2>
          </div>
          <button
            className="yj-modal-close-btn"
            onClick={onClose}
            title="Close instruction reference"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="yj-instruction-toolbar">
          <div className="yj-search-wrapper">
            <Search className="yj-search-icon" size={16} />
            <input
              type="text"
              className="yj-instruction-search"
              placeholder="Search instruction, opcode, syntax, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                className="yj-search-clear-btn"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="yj-category-tabs">
            {INSTRUCTION_CATEGORIES.map((category) => (
              <button
                key={category}
                className={`yj-category-tab ${selectedCategory === category ? "active" : ""}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Instruction List Content */}
        <div className="yj-instruction-body">
          {filteredInstructions.length === 0 ? (
            <div className="yj-instruction-empty">
              <p>No instructions match your search query "{searchQuery}".</p>
            </div>
          ) : (
            <div className="yj-instruction-grid">
              {filteredInstructions.map((item: InstructionItem) => (
                <div key={item.opcode} className="yj-instruction-card">
                  <div className="yj-instruction-card-header">
                    <div className="yj-opcode-badge">{item.opcode}</div>
                    <span className="yj-instruction-name">{item.name}</span>
                    <span className="yj-category-badge">{item.category}</span>
                  </div>

                  <div className="yj-instruction-card-body">
                    <div className="yj-syntax-row">
                      <span className="yj-meta-label">Syntax:</span>
                      <code className="yj-syntax-code">{item.syntax}</code>
                    </div>

                    <p className="yj-instruction-desc">{item.description}</p>

                    <div className="yj-flags-row">
                      <span className="yj-meta-label">Flags Affected:</span>
                      <div className="yj-flags-list">
                        {item.flagsAffected.map((flag) => (
                          <span key={flag} className="yj-flag-tag">
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Example Snippet & Insertion Action */}
                    <div className="yj-example-box">
                      <div className="yj-example-header">
                        <span className="yj-meta-label">Code Example:</span>
                        <div className="yj-example-actions">
                          <button
                            className="yj-example-action-btn"
                            title="Copy snippet"
                            onClick={() =>
                              handleCopyExample(item.example, item.opcode)
                            }
                          >
                            {copiedOpcode === item.opcode ? (
                              <Check size={14} className="copied-icon" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                          <button
                            className="yj-btn-insert-example"
                            onClick={() => {
                              onSelectExample(item.example);
                              onClose();
                            }}
                            title="Insert snippet into code editor"
                          >
                            <Code size={14} />
                            <span>Insert Example</span>
                          </button>
                        </div>
                      </div>
                      <pre className="yj-example-code">{item.example}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
