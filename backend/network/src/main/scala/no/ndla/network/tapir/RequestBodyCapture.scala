package no.ndla.network.tapir

import io.netty.buffer.ByteBuf
import no.ndla.network.tapir.RequestBodyCapture.{DefaultInitialSize, MaxSize}

import java.io.ByteArrayOutputStream
import java.nio.charset.StandardCharsets

object RequestBodyCapture {
  private val DefaultInitialSize = 8L * 1024L         // 8 KiB
  private val MaxSize            = 1L * 1024L * 1024L // 1 MiB
}

class RequestBodyCapture(contentLength: Option[Long]) {
  private val initialSize = contentLength.map(l => math.min(l, MaxSize)).getOrElse(DefaultInitialSize)
  private val buffer      = new ByteArrayOutputStream(initialSize.toInt)
  private var totalBytes  = 0L

  private[tapir] def append(content: ByteBuf): Unit = synchronized {
    val readable = content.readableBytes().toLong
    totalBytes += readable
    val room   = MaxSize - buffer.size()
    val toRead = math.min(room, readable).toInt
    if (room > 0) {
      content.getBytes(content.readerIndex(), buffer, toRead): Unit
    }
  }

  def asString: String = synchronized {
    val body = buffer.toString(StandardCharsets.UTF_8)
    if (totalBytes > buffer.size()) s"$body...[truncated, $totalBytes bytes total]"
    else body
  }
}
