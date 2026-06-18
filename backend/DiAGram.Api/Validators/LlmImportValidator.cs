using DiAGram.Api.Dtos;

namespace DiAGram.Api.Validators;

/// <summary>
/// Guards the import endpoint against malformed LLM output: wrong schema, orphan edges
/// (referencing a missing node) and duplicate node ids. Returns field→messages for 400s.
/// </summary>
public static class LlmImportValidator
{
    private const string SchemaId = "d-ia-gram-v1";

    public static Dictionary<string, string[]> Validate(LlmExportDto payload)
    {
        var errors = new Dictionary<string, string[]>();
        if (payload.Schema != SchemaId)
            errors["$schema"] = [$"Esperado \"{SchemaId}\", recebido \"{payload.Schema}\"."];
        for (var i = 0; i < payload.Diagrams.Count; i++)
            ValidateDiagram(payload.Diagrams[i], i, errors);
        return errors;
    }

    private static void ValidateDiagram(ExportedDiagramDto diagram, int index, Dictionary<string, string[]> errors)
    {
        var nodeIds = new HashSet<string>();
        var duplicates = diagram.Nodes.Where(n => !nodeIds.Add(n.Id)).Select(n => n.Id).ToList();
        if (duplicates.Count > 0)
            errors[$"diagrams[{index}].nodes"] = [$"Ids de nó duplicados: {string.Join(", ", duplicates)}."];

        var orphans = diagram.Edges
            .Where(e => !nodeIds.Contains(e.SourceNodeId) || !nodeIds.Contains(e.TargetNodeId))
            .Select(e => e.Id)
            .ToList();
        if (orphans.Count > 0)
            errors[$"diagrams[{index}].edges"] = [$"Arestas referenciando nós inexistentes: {string.Join(", ", orphans)}."];
    }
}
