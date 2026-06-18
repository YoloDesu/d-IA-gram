using System.Text.Json;
using System.Text.Json.Serialization;

namespace DiAGram.Api.Serialization;

/// <summary>
/// JsonStringEnumConverter pinned to camelCase, usable as a [JsonConverter] attribute.
/// Applying it on an enum makes it (de)serialize as camelCase strings everywhere —
/// API responses, stored blobs, and typed test clients — without per-options config.
/// </summary>
public sealed class CamelCaseEnumConverter : JsonStringEnumConverter
{
    public CamelCaseEnumConverter() : base(JsonNamingPolicy.CamelCase) { }
}
