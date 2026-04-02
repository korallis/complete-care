'use client';

import { useState } from 'react';
import type { TaskTemplate, TemplateTask } from '@/lib/db/schema/visit-tasks';
import { VISIT_TYPE_CONFIG, type VisitType } from '../constants';

interface TemplateManagerProps {
  templates: TaskTemplate[];
  selectedTemplate: TaskTemplate | null;
  templateTasks: TemplateTask[];
  onSelectTemplate: (id: string) => void;
  onCreateTemplate: (name: string, visitType: string, description?: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onAddTask: (templateId: string, title: string, isMandatory: boolean) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TemplateManager({
  templates,
  selectedTemplate,
  templateTasks,
  onSelectTemplate,
  onCreateTemplate,
  onToggleActive,
  onAddTask,
  onDeleteTask,
}: TemplateManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newVisitType, setNewVisitType] = useState<string>('personal_care');
  const [newDescription, setNewDescription] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMandatory, setNewTaskMandatory] = useState(false);

  const handleCreate = () => {
    if (newName.trim()) {
      onCreateTemplate(newName.trim(), newVisitType, newDescription.trim() || undefined);
      setNewName('');
      setNewDescription('');
      setShowCreateForm(false);
    }
  };

  const handleAddTask = () => {
    if (selectedTemplate && newTaskTitle.trim()) {
      onAddTask(selectedTemplate.id, newTaskTitle.trim(), newTaskMandatory);
      setNewTaskTitle('');
      setNewTaskMandatory(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Template list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Task Templates</h3>
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            {showCreateForm ? 'Cancel' : 'New Template'}
          </button>
        </div>

        {showCreateForm && (
          <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <input
              type="text"
              placeholder="Template name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              value={newVisitType}
              onChange={(e) => setNewVisitType(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              {Object.entries(VISIT_TYPE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              rows={2}
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Create Template
            </button>
          </div>
        )}

        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {templates.map((template) => {
            const visitTypeConfig =
              VISIT_TYPE_CONFIG[template.visitType as VisitType];
            const isSelected = selectedTemplate?.id === template.id;

            return (
              <li key={template.id}>
                <button
                  type="button"
                  onClick={() => onSelectTemplate(template.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {template.name}
                      </p>
                      {template.description && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {template.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {visitTypeConfig && (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${visitTypeConfig.colour}`}
                        >
                          {visitTypeConfig.label}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleActive(template.id, !template.isActive);
                        }}
                        className={`text-xs px-2 py-0.5 rounded ${
                          template.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {template.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
          {templates.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-gray-500">
              No templates yet. Create one to get started.
            </li>
          )}
        </ul>
      </div>

      {/* Template tasks */}
      <div className="space-y-4">
        {selectedTemplate ? (
          <>
            <h3 className="text-lg font-semibold text-gray-900">
              Tasks in &ldquo;{selectedTemplate.name}&rdquo;
            </h3>

            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {templateTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {task.title}
                    </p>
                    {task.instructions && (
                      <p className="text-xs text-gray-500">{task.instructions}</p>
                    )}
                    <div className="mt-1 flex gap-2">
                      {task.isMandatory && (
                        <span className="text-xs text-red-600 font-medium">
                          Required
                        </span>
                      )}
                      {task.estimatedMinutes && (
                        <span className="text-xs text-gray-400">
                          ~{task.estimatedMinutes} min
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteTask(task.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
              {templateTasks.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-gray-500">
                  No tasks yet. Add one below.
                </li>
              )}
            </ul>

            {/* Add task form */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-1 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={newTaskMandatory}
                  onChange={(e) => setNewTaskMandatory(e.target.checked)}
                />
                Required
              </label>
              <button
                type="button"
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
                className="rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
              >
                Add Task
              </button>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            Select a template to manage its tasks
          </div>
        )}
      </div>
    </div>
  );
}
