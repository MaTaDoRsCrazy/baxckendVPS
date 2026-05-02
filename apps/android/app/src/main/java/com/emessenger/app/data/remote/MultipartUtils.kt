package com.emessenger.app.data.remote

import android.content.ContentResolver
import android.database.Cursor
import android.net.Uri
import android.provider.OpenableColumns
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody

data class UploadPayload(
    val part: MultipartBody.Part,
    val mimeType: String,
    val originalName: String,
    val size: Int
)

fun ContentResolver.createUploadPayload(uri: Uri): UploadPayload {
    val mimeType = getType(uri) ?: "application/octet-stream"
    val bytes = openInputStream(uri)?.use { it.readBytes() }
        ?: error("Не удалось прочитать файл")
    val fileName = queryDisplayName(uri) ?: "upload.bin"
    val requestBody = bytes.toRequestBody(mimeType.toMediaTypeOrNull())
    return UploadPayload(
        part = MultipartBody.Part.createFormData("file", fileName, requestBody),
        mimeType = mimeType,
        originalName = fileName,
        size = bytes.size
    )
}

private fun ContentResolver.queryDisplayName(uri: Uri): String? {
    val cursor: Cursor = query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null) ?: return null
    cursor.use {
        if (!it.moveToFirst()) return null
        val columnIndex = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
        if (columnIndex == -1) return null
        return it.getString(columnIndex)
    }
}
