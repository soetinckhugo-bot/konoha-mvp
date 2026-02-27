/**
 * ExportService Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { ExportService } from '../ExportService';

describe('ExportService', () => {
  describe('exportToCSV', () => {
    it('should export data to CSV', () => {
      const data = [
        { name: 'Faker', team: 'T1', kda: 4.5 },
        { name: 'Chovy', team: 'GEN', kda: 5.2 },
      ];
      
      // Mock download
      const createObjectURL = vi.fn(() => 'blob:url');
      const revokeObjectURL = vi.fn();
      global.URL.createObjectURL = createObjectURL;
      global.URL.revokeObjectURL = revokeObjectURL;
      
      expect(() => {
        ExportService.exportToCSV(data, 'test.csv');
      }).not.toThrow();
    });

    it('should handle empty data', () => {
      expect(() => {
        ExportService.exportToCSV([], 'empty.csv');
      }).not.toThrow();
    });
  });

  describe('exportToJSON', () => {
    it('should export data to JSON', () => {
      const data = { players: [{ name: 'Faker' }] };
      
      expect(() => {
        ExportService.exportToJSON(data, 'test.json');
      }).not.toThrow();
    });
  });

  describe('downloadBlob', () => {
    it('should download blob', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      
      expect(() => {
        ExportService.downloadBlob(blob, 'test.txt');
      }).not.toThrow();
    });
  });
});
