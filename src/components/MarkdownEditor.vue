<script setup lang="ts">
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { Compartment, EditorState } from "@codemirror/state";
import { drawSelection, EditorView, keymap } from "@codemirror/view";
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { formatState, insertLink, toggleInline, type FormatState } from "../editor/formatting";
import { livePreview, livePreviewAttrs } from "../editor/livePreview";
import { cellTypingEvent, tablePreview } from "../editor/table";
import { editorHighlight, editorTheme } from "../editor/theme";

export type EditorMode = "live" | "source";

const props = defineProps<{ docId: string; modelValue: string; mode: EditorMode }>();
const emit = defineEmits<{
  "update:modelValue": [value: string];
  format: [state: FormatState];
}>();

const host = ref<HTMLDivElement>();
const view = shallowRef<EditorView>();
const modeCompartment = new Compartment();
// One EditorState per document keeps undo history and cursor when switching files.
const states = new Map<string, EditorState>();

function modeExtension(mode: EditorMode) {
  return mode === "live" ? [livePreview, tablePreview, livePreviewAttrs] : [];
}

function createState(doc: string) {
  return EditorState.create({
    doc,
    extensions: [
      // Typing in a table cell re-pads the whole column, so those edits are never adjacent; group them anyway.
      history({ joinToEvent: (tr, adjacent) => adjacent || tr.isUserEvent(cellTypingEvent) }),
      drawSelection(),
      EditorView.lineWrapping,
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      editorHighlight,
      editorTheme,
      modeCompartment.of(modeExtension(props.mode)),
      keymap.of([
        { key: "Mod-b", run: (v) => toggleInline(v, "bold") },
        { key: "Mod-i", run: (v) => toggleInline(v, "italic") },
        { key: "Mod-e", run: (v) => toggleInline(v, "code") },
        { key: "Mod-Shift-x", run: (v) => toggleInline(v, "strike") },
        { key: "Mod-k", run: insertLink },
        indentWithTab,
        ...defaultKeymap,
        ...historyKeymap,
      ]),
      EditorView.updateListener.of((u) => {
        if (u.docChanged) emit("update:modelValue", u.state.doc.toString());
        if (u.docChanged || u.selectionSet) emit("format", formatState(u.state));
      }),
    ],
  });
}

function stateFor(id: string, doc: string) {
  const saved = states.get(id);
  // Reuse the cached state unless the content was changed outside the editor.
  if (saved && saved.doc.toString() === doc) return saved;
  return createState(doc);
}

onMounted(() => {
  view.value = new EditorView({ parent: host.value!, state: stateFor(props.docId, props.modelValue) });
  emit("format", formatState(view.value.state));
  view.value.focus();
});

onBeforeUnmount(() => view.value?.destroy());

watch(
  () => props.docId,
  (id, prev) => {
    const v = view.value;
    if (!v) return;
    states.set(prev, v.state);
    v.setState(stateFor(id, props.modelValue));
    // setState resets compartments to what the state was created with.
    v.dispatch({ effects: modeCompartment.reconfigure(modeExtension(props.mode)) });
    emit("format", formatState(v.state));
    v.focus();
  },
);

watch(
  () => props.mode,
  (mode) => view.value?.dispatch({ effects: modeCompartment.reconfigure(modeExtension(mode)) }),
);

defineExpose({ view });
</script>

<template>
  <div ref="host" class="markdown-editor" />
</template>

<style scoped>
.markdown-editor {
  height: 100%;
  user-select: text;
}
</style>
