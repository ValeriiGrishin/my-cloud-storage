import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

/**
 * Экшены для работы с файлами (Redux Thunk)
 */


//Получение списка файлов
export const fetchFiles = createAsyncThunk('files/fetchFiles', async (page = 1) => {
  const response = await api.get(`/files/?page=${page}`);
  return {
    results: response.data.results,
    count: response.data.count,
    next: response.data.next,
    previous: response.data.previous,
  };
});
//Загрузка нового файла
export const uploadFile = createAsyncThunk('files/uploadFile', async (formData) => {
  const response = await api.post('/files/upload/', formData);
  return response.data;
});
//Удаление файла по ID
export const deleteFile = createAsyncThunk('files/deleteFile', async (fileId) => {
  await api.delete(`/files/${fileId}/delete/`);
  return fileId;
});
//Переименование файла
export const renameFile = createAsyncThunk('files/renameFile', async ({ fileId, newName }) => {
  const response = await api.put(`/files/${fileId}/rename/`, { new_name: newName });
  return response.data;
});
//Изменение комментария к файлу
export const updateComment = createAsyncThunk('files/updateComment', async ({ fileId, comment }) => {
  const response = await api.put(`/files/${fileId}/comment/`, { comment });
  return response.data;
});
//
const fileSlice = createSlice({
  name: 'files',
  initialState: { files: [], loading: false, error: null },
  reducers: { clearFiles: (state) => { state.files = []; state.error = null; } },
  extraReducers: (builder) => {
    builder
      
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload.results;
        state.totalCount = action.payload.count;
        state.nextPage = action.payload.next;
        state.prevPage = action.payload.previous;
      })
      .addCase(fetchFiles.pending, (state) => { state.loading = true; })
      .addCase(uploadFile.fulfilled, (state, action) => { state.files.push(action.payload); })
      .addCase(deleteFile.fulfilled, (state, action) => { state.files = state.files.filter(f => f.id !== action.payload); })
      .addCase(renameFile.fulfilled, (state, action) => {
        const index = state.files.findIndex(f => f.id === action.payload.id);
        if (index !== -1) state.files[index] = action.payload;
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        const index = state.files.findIndex(f => f.id === action.payload.id);
        if (index !== -1) state.files[index] = action.payload;
      });
  },
});

export const { clearFiles } = fileSlice.actions;
export default fileSlice.reducer;