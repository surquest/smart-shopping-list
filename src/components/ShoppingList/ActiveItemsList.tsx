import React from 'react';
import { List } from '@mui/material';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult, 
  DroppableProvided, 
  DraggableProvided, 
  DraggableStateSnapshot 
} from '@hello-pangea/dnd';
import ShoppingItem from "./types/ShoppingItem.types";
import ShoppingListItem from './ShoppingListItem';

import { Translation } from '../../i18n';

interface ActiveItemsListProps {
  /** Array of shopping items to display */
  items: ShoppingItem[];
  /** Handler for when a drag operation completes */
  onDragEnd: (result: DropResult) => void;
  /** Actions to perform on item interaction */
  onTogglePurchase: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onStartEdit: (item: ShoppingItem) => void;
  /** State for the inline editing feature */
  editingId: string | null;
  editingText: string;
  onEditingTextChange: (text: string) => void;
  onSaveEdit: () => void;
  /** Context menu handler */
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, id: string) => void;
  /** Internationalization function */
  t: Translation;
}

/**
 * Renders a sortable list of active shopping items using Drag and Drop.
 */
export const ActiveItemsList: React.FC<ActiveItemsListProps> = React.memo(({
  items,
  onDragEnd,
  onTogglePurchase,
  onUpdateQuantity,
  onStartEdit,
  editingId,
  editingText,
  onEditingTextChange,
  onSaveEdit,
  onMenuOpen,
  t,
}) => {

  // Defensive check: If items are undefined/null, render nothing or a fallback
  if (!items) return null;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* Droppable Area: 
        The 'droppableId' must be unique within the DragDropContext. 
      */}
      <Droppable droppableId="shopping-list-active">
        {(provided: DroppableProvided) => (
          <List
            // Connect the DOM element to the library
            ref={provided.innerRef} 
            // Apply required accessibility and event listener props
            {...provided.droppableProps}
            // Ensure the list has height so items can be dropped even if empty
            sx={{ minHeight: 100 }} 
          >
            {items.map((item, index) => (
              <Draggable 
                key={item.id} 
                draggableId={item.id} 
                index={index}
              >
                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                  <ShoppingListItem
                    // Data Props
                    item={item}
                    isPurchased={false}
                    
                    // Interaction Handlers
                    // We wrap these to pass the specific ID, keeping the child component generic
                    onTogglePurchase={() => onTogglePurchase(item.id)}
                    onUpdateQuantity={(delta) => onUpdateQuantity(item.id, delta)}
                    onMenuOpen={(e) => onMenuOpen(e, item.id)}
                    
                    // Edit Mode Props
                    onStartEdit={() => onStartEdit(item)}
                    isEditing={editingId === item.id}
                    editingText={editingText}
                    onEditingTextChange={onEditingTextChange}
                    onSaveEdit={onSaveEdit}
                    
                    // Context / Util Props
                    t={t}
                    
                    // Drag and Drop specific Props passed to Child
                    // innerRef helps measure the DOM node
                    innerRef={provided.innerRef}
                    // draggableProps controls the movement logic
                    draggableProps={provided.draggableProps}
                    // dragHandleProps is applied to the specific part of the UI used to grab the item
                    dragHandleProps={provided.dragHandleProps}
                    // snapshot allows styling changes while dragging (e.g. adding a shadow)
                    isDragging={snapshot.isDragging}
                  />
                )}
              </Draggable>
            ))}
            
            {/* Placeholder: 
               This is crucial. It creates space in the list as you drag an item over it,
               preventing the list from collapsing.
            */}
            {provided.placeholder}
          </List>
        )}
      </Droppable>
    </DragDropContext>
  );
});

// Display name for debugging tools
ActiveItemsList.displayName = 'ActiveItemsList';