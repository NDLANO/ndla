package no.ndla.network.tapir

import io.netty.buffer.ByteBuf
import no.ndla.network.tapir.RequestBodyCapture.{DefaultInitialSize, MaxSize}

import java.io.ByteArrayOutputStream
import java.nio.charset.StandardCharsets

object RequestBodyCapture {
  private val DefaultInitialSize = 8 * 1024        // 8 KiB
  private val MaxSize            = 1 * 1024 * 1024 // 1 MiB
}

class RequestBodyCapture(contentLength: Option[Long]) {
  private val initialSize = contentLength.map(l => math.min(l.toInt, MaxSize)).getOrElse(DefaultInitialSize)
  private val buffer      = new ByteArrayOutputStream(initialSize)
  private var totalBytes  = 0

  private[tapir] def append(content: ByteBuf): Unit = synchronized {
    val readable = content.readableBytes()
    totalBytes += readable
    val room = MaxSize - buffer.size()
    if (room > 0) {
      content.getBytes(content.readerIndex(), buffer, math.min(room, readable)): Unit
    }
  }

  def asString: String = synchronized {
    val body = buffer.toString(StandardCharsets.UTF_8)
    if (totalBytes > buffer.size()) s"$body...[truncated, $totalBytes bytes total]"
    else body
  }
}
