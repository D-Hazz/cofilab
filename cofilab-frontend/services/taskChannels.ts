import api from './api'

export const taskChannels = {
  retrieveByTask: async (taskId: number) => {
    const res = await api.get(`/task-channels/?task=${taskId}`)
    return res.data
  },

  retrieve: async (id: number) => {
    const res = await api.get(`/task-channels/${id}/`)
    return res.data
  },

  sendMessage: async (channelId: number, data: FormData) => {
    const res = await api.post(
      `/task-channels/${channelId}/send_message/`,
      data,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
    return res.data
  },

  getMessages: async (channelId: number, page: number = 1, pageSize: number = 50) => {
    const res = await api.get(
      `/task-channels/${channelId}/messages/?page=${page}&page_size=${pageSize}`
    )
    return res.data
  },
}