import { useState, useMemo } from 'react'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'

const UsersModule = ({ users, onUpdateUsers }) => {
  const [editingId, setEditingId] = useState(null)
  const [editedUser, setEditedUser] = useState(null)

  const handleEdit = (user) => {
    setEditingId(user.id)
    setEditedUser({ ...user })
  }

  const handleSave = (id) => {
    onUpdateUsers(
      users.map((user) => (user.id === id ? editedUser : user))
    )
    setEditingId(null)
    setEditedUser(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditedUser(null)
  }

  const handleDelete = (id) => {
    if (window.confirm('Da li ste sigurni da želite da izbrišete ovog korisnika?')) {
      onUpdateUsers(users.filter((user) => user.id !== id))
    }
  }

  const handleAdd = () => {
    const newId = Math.max(...users.map((u) => u.id), 0) + 1
    const newUser = {
      id: newId,
      ime: '',
      email: '',
      password: '',
    }
    setEditingId(newId)
    setEditedUser(newUser)
    onUpdateUsers([...users, newUser])
  }

  const handleFieldChange = (field, value) => {
    setEditedUser({
      ...editedUser,
      [field]: value,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Korisnici</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150"
          aria-label="Dodaj novog korisnika"
          type="button"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          Dodaj korisnika
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Password
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcije
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    Nema korisnika. Dodajte prvog korisnika.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === user.id ? (
                        <input
                          type="text"
                          value={editedUser.ime}
                          onChange={(e) => handleFieldChange('ime', e.target.value)}
                          className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          aria-label="Ime korisnika"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{user.ime}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === user.id ? (
                        <input
                          type="email"
                          value={editedUser.email}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          aria-label="Email korisnika"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{user.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === user.id ? (
                        <input
                          type="text"
                          value={editedUser.password}
                          onChange={(e) => handleFieldChange('password', e.target.value)}
                          className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          aria-label="Password korisnika"
                        />
                      ) : (
                        <div className="text-sm text-gray-500">••••••••</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === user.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleSave(user.id)}
                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded"
                            title="Sačuvaj"
                            aria-label={`Sačuvaj izmene za korisnika ${user.ime}`}
                            type="button"
                          >
                            <Save className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-50 rounded"
                            title="Otkaži"
                            aria-label="Otkaži izmene"
                            type="button"
                          >
                            <X className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded"
                            title="Izmijeni"
                            aria-label={`Izmijeni korisnika ${user.ime}`}
                            type="button"
                          >
                            <Edit className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                            title="Izbriši"
                            aria-label={`Izbriši korisnika ${user.ime}`}
                            type="button"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default UsersModule

