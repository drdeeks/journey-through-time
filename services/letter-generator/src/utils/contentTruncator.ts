// ============================================
// Journey Through Time - Letter Generator Backend
// Content Truncation Utility
// ============================================

import {
  TRUNCATION_CONFIG,
  MATRIX_CONFIG,
} from '../config';
import {
  ContentTruncationWarning,
  TruncationConfig,
} from '../types';

/**
 * Content Truncator Utility
 * 
 * Handles intelligent content truncation for long letters
 * - Respects word boundaries when possible
 * - Adds truncation markers
 * - Handles various content types (plain text, markdown, etc.)
 */
export class ContentTruncator {
  private config: TruncationConfig;

  constructor(config: Partial<TruncationConfig> = {}) {
    this.config = {
      ...TRUNCATION_CONFIG,
      ...config,
    };
  }

  /**
   * Truncate content to maximum length
   * @param content The content to truncate
   * @param maxLength Maximum allowed length (overrides config if provided)
   * @returns Truncated content and metadata
   */
  truncate(
    content: string,
    maxLength: number = this.config.MAX_LENGTH,
  ): {
    content: string;
    wasTruncated: boolean;
    originalLength: number;
    truncatedLength: number;
  } {
    const originalLength = content.length;

    // If content is already within limits, return as-is
    if (originalLength <= maxLength) {
      return {
        content,
        wasTruncated: false,
        originalLength,
        truncatedLength: originalLength,
      };
    }

    // Truncate the content
    const truncated = this._intelligentTruncate(content, maxLength);
    const truncatedLength = truncated.length;

    // Add truncation marker if there's room
    let finalContent = truncated;
    if (
      this.config.TRUNCATION_MARKER &&
      truncatedLength + this.config.TRUNCATION_MARKER.length <= maxLength
    ) {
      finalContent = truncated + this.config.TRUNCATION_MARKER;
    }

    return {
      content: finalContent,
      wasTruncated: true,
      originalLength,
      truncatedLength: finalContent.length,
    };
  }

  /**
   * Intelligent truncation that tries to preserve word boundaries
   */
  private _intelligentTruncate(content: string, maxLength: number): string {
    if (!this.config.PRESERVE_WORDS) {
      return content.substring(0, maxLength);
    }

    // Find the last space before maxLength
    let truncateAt = maxLength;
    
    // Look backwards for a space
    for (let i = Math.min(maxLength - 1, content.length - 1); i >= 0; i--) {
      if (content[i] === ' ' || content[i] === '\n' || content[i] === '\t') {
        truncateAt = i;
        break;
      }
    }

    // If we didn't find a space and the word is too short to break,
    // just truncate at maxLength
    const word = content.substring(truncateAt, maxLength);
    if (word.length <= this.config.MIN_WORD_LENGTH) {
      truncateAt = maxLength;
    }

    return content.substring(0, truncateAt);
  }

  /**
   * Truncate content specifically for Matthew's letters
   * Matches the wording and style constraints
   */
  truncateForMatrix(
    content: string,
    isCustomContent: boolean = false,
  ): {
    content: string;
    wasTruncated: boolean;
    originalLength: number;
    truncatedLength: number;
    warning?: ContentTruncationWarning;
  } {
    const maxLength = isCustomContent
      ? MATRIX_CONFIG.MAX_WINDOW_LENGTH
      : TRUNCATION_CONFIG.MAX_LENGTH;

    const result = this.truncate(content, maxLength);

    // Add warning if truncated
    let warning: ContentTruncationWarning | undefined;
    if (result.wasTruncated) {
      warning = new ContentTruncationWarning(
        `Matthew's content exceeded maximum length of ${maxLength} characters`,
        result.originalLength,
        result.truncatedLength,
      );
    }

    return {
      ...result,
      warning,
    };
  }

  /**
   * Truncate an array of content pieces (e.g., for multi-part letters)
   */
  truncateMultiple(
    contents: string[],
    maxTotalLength: number,
  ): {
    contents: string[];
    wasTruncated: boolean;
    totalOriginalLength: number;
    totalTruncatedLength: number;
    truncatedIndices: number[];
  } {
    const result: string[] = [];
    const truncatedIndices: number[] = [];
    let totalOriginalLength = 0;
    let totalTruncatedLength = 0;
    let wasTruncated = false;
    let remainingLength = maxTotalLength;

    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];
      totalOriginalLength += content.length;

      if (remainingLength <= 0) {
        // No room left, skip this content
        truncatedIndices.push(i);
        wasTruncated = true;
        continue;
      }

      // Check if this content needs truncation
      if (content.length <= remainingLength) {
        result.push(content);
        totalTruncatedLength += content.length;
        remainingLength -= content.length;
      } else {
        // Truncate this content
        const truncated = this._intelligentTruncate(content, remainingLength);
        result.push(truncated);
        totalTruncatedLength += truncated.length;
        truncatedIndices.push(i);
        wasTruncated = true;
        remainingLength = 0; // No more room
      }
    }

    return {
      contents: result,
      wasTruncated,
      totalOriginalLength,
      totalTruncatedLength,
      truncatedIndices,
    };
  }

  /**
   * Validate content length without truncating (for pre-validation)
   */
  validateLength(content: string, maxLength?: number): boolean {
    const limit = maxLength ?? this.config.MAX_LENGTH;
    return content.length <= limit;
  }

  /**
   * Get truncation statistics
   */
  getStats(content: string): {
    isValid: boolean;
    currentLength: number;
    maxLength: number;
    excess: number;
    truncationRatio: number;
  } {
    const currentLength = content.length;
    const maxLength = this.config.MAX_LENGTH;
    const isValid = currentLength <= maxLength;
    const excess = isValid ? 0 : currentLength - maxLength;
    const truncationRatio = isValid ? 1 : maxLength / currentLength;

    return {
      isValid,
      currentLength,
      maxLength,
      excess,
      truncationRatio,
    };
  }

  /**
   * Preview truncation (show what would be truncated)
   */
  previewTruncation(
    content: string,
    maxLength: number = this.config.MAX_LENGTH,
  ): {
    before: string;
    after: string;
    removed: string;
    wasTruncated: boolean;
  } {
    const originalLength = content.length;

    if (originalLength <= maxLength) {
      return {
        before: content,
        after: content,
        removed: '',
        wasTruncated: false,
      };
    }

    const truncated = this._intelligentTruncate(content, maxLength);
    const finalContent =
      truncated + (this.config.TRUNCATION_MARKER ?? '');
    const removed = content.substring(maxLength);

    return {
      before: content,
      after: finalContent,
      removed,
      wasTruncated: true,
    };
  }
}

// Export singleton instance
export const contentTruncator = new ContentTruncator();
export default contentTruncator;
