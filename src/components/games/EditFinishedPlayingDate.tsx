'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '../shared/DatePicker';
import { EditIcon, CheckIcon, XIcon } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface EditFinishedPlayingDateProps {
  currentDate: Timestamp | null;
  onSave: (newDate: Date | null) => Promise<void>;
  disabled?: boolean;
}

export function EditFinishedPlayingDate({
  currentDate,
  onSave,
  disabled = false,
}: EditFinishedPlayingDateProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState(currentDate?.toDate() || new Date());
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = () => {
    setEditDate(currentDate?.toDate() || new Date());
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditDate(currentDate?.toDate() || new Date());
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editDate);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving date:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    setIsSaving(true);
    try {
      await onSave(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error removing date:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleStartEdit}
        disabled={disabled}
        className="h-auto p-0 hover:bg-transparent"
      >
        <EditIcon className="h-3 w-3 ml-2 opacity-50 hover:opacity-100" />
      </Button>
    );
  }

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
      <DatePicker
        date={editDate}
        onDateChange={setEditDate}
        disabled={isSaving}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1"
        >
          {isSaving ? (
            <>
              <div className="h-3 w-3 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Guardando...
            </>
          ) : (
            <>
              <CheckIcon className="h-3 w-3 mr-2" />
              Guardar
            </>
          )}
        </Button>
        {currentDate && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={isSaving}
          >
            Quitar
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <XIcon className="h-3 w-3 mr-2" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}