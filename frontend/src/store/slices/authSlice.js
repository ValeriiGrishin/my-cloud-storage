import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

/**
 * Экшены для работы с аутентификацией (Redux Thunk)
 */

// Регистрация нового пользователя
export const register = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register/', data);
      return response.data;
    } catch (error) {
      // Возвращаем данные ошибки через rejectWithValue
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue({ error: 'Ошибка подключения к серверу' });
    }
  }
);

// Вход в систему
export const login = createAsyncThunk(
  'auth/login',
  async (creds, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login/', creds);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue({ error: 'Ошибка подключения к серверу' });
    }
  }
);

// Выход из системы
export const logout = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout/');
});

// Получение данных текущего авторизованного пользователя
export const getCurrentUser = createAsyncThunk('auth/getCurrentUser', async () => {
  const response = await api.get('/auth/me/');
  return response.data;
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, isAuthenticated: false, loading: false, error: null },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // РЕГИСТРАЦИЯ
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        const errorData = action.payload;
        if (errorData?.username) state.error = errorData.username[0];
        else if (errorData?.email) state.error = errorData.email[0];
        else if (errorData?.password) state.error = errorData.password[0];
        else state.error = 'Ошибка регистрации';
      })
      // ВХОД
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        const errorData = action.payload;
        state.error = errorData?.error || 'Неверный логин или пароль';
      })
      // ВЫХОД
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      // ПОЛУЧЕНИЕ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;